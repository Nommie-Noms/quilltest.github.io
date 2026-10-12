(function () {
 'use strict';
 var $ = function (id) { return document.getElementById(id); };
 var config = window.PORTAL_CONFIG;
 var mode = 'login', user = null, profile = null, staff = false, selected = null, version = 0;
 var names = {}, busy = false, links = {contract:'',documentation:''};
 var client, toastTimer;
 function toast(text,info) {
  clearTimeout(toastTimer);
  $('copy-toast').textContent=text;
  $('copy-toast').className='toast visible'+(info?' info':'');
  toastTimer=setTimeout(function(){$('copy-toast').className='toast';$('copy-toast').textContent='';},info?6000:4000);
 }
 function status(text) { $('status').textContent = text || ''; }
 function hide(id, hidden) { $(id).hidden = hidden; }
 function money(value) { return '$' + Number(value).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}); }
 function syncCopyButtons() { $('copy-contract').disabled=busy || !links.contract; $('copy-documentation').disabled=busy || !links.documentation; }
 function clearPackage() { links={contract:'',documentation:''};$('package-name').textContent='Not assigned';$('monthly-cost').textContent='—';$('package-input').value='';$('cost-input').value='0';$('contract-input').value='';$('documentation-input').value='';$('manual-copy').value='';hide('manual-copy-label',true);$('links-note').textContent='';syncCopyButtons(); }
 function check(result) { if(result.error) throw new Error(result.error.message); return result.data; }
 function setMode(next) {
  mode = next;
  hide('display-label',next!=='register'); hide('recovery-label',next!=='recover');
  $('display-name').required = next==='register'; $('recovery-input').required = next==='recover';
  $('password').autocomplete = next==='login' ? 'current-password' : 'new-password';
  $('auth-title').textContent = next==='login' ? 'Sign in' : next==='register' ? 'Create account' : 'Reset your password';
  $('auth-submit').textContent = next==='login' ? 'Sign in' : next==='register' ? 'Create account' : 'Reset password';
  document.querySelectorAll('[data-mode]').forEach(function(button) {button.setAttribute('aria-pressed',String(button.dataset.mode===next));});
  status('');
 }
 async function run(task) {
  if(busy) return;
  busy=true;
  var buttons=Array.from(document.querySelectorAll('button, input, select, textarea'));
  buttons.forEach(function(button){button.disabled=true;});
  try {await task();} catch(error) {status(error.message || 'Something went wrong. Please try again.');}
  finally {busy=false; buttons.forEach(function(button){button.disabled=false;});syncCopyButtons();}
 }
 function clearDashboard() {
  hide('password-change',true);hide('staff-recovery',true);hide('staff-reset-result',true);$('issued-password').value='';$('issued-code').value='';$('current-temporary').value='';$('permanent-password').value='';
  version++; user=null; profile=null; selected=null; staff=false; names={};
  clearPackage();hide('service-editor',true);$('messages').textContent='';$('client-select').textContent='';
  $('account-name').textContent=''; $('message').value='';
  hide('dashboard',true); hide('account',false);
 }
 async function loadDashboard(session) {
  clearDashboard();
  if(!session) return;
  user=session.user;
  var accountId=user.id;
  var security=check(await client.from('account_security').select('password_required,revoked_before,phase').eq('user_id',accountId).maybeSingle());
  if(security && security.password_required) {
   hide('account',true);hide('password-change',false);
   status(security.phase==='awaiting_change'?'Change your temporary password to continue.':'Account recovery needs staff assistance. Ask staff to issue a new temporary password.');
   return;
  }
  if(security && security.revoked_before) {
   var claims=JSON.parse(atob(session.access_token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
   if(Number(claims.iat)<=Number(security.revoked_before)){check(await client.auth.signOut({scope:'local'}));clearDashboard();status('This session has been revoked. Sign in again.');return;}
  }
  var results=await Promise.all([client.from('profiles').select('id,username,display_name').eq('id',accountId).single(),client.from('staff').select('user_id').eq('user_id',accountId)]);
  profile=check(results[0]); staff=check(results[1]).length>0;
  names[accountId]=profile.display_name;
  $('account-name').textContent=profile.display_name;
  $('role-label').textContent=staff?'STAFF ACCOUNT':'CLIENT ACCOUNT';
  hide('client-label',!staff);hide('staff-recovery',!staff);hide('service-editor',!staff);
  if(staff) {
   // Paginate profiles so staff can reach every client, beyond the API's default row limit.
   var clients=[],offset=0,batch;
   do {batch=check(await client.from('profiles').select('id,username,display_name').order('username').range(offset,offset+499));clients=clients.concat(batch);offset+=500;} while(batch.length===500);
   clients.forEach(function(item){names[item.id]=item.display_name;var option=document.createElement('option');option.value=item.id;option.textContent=item.display_name+' (@'+item.username+')';$('client-select').appendChild(option);});
   selected=clients.length?clients[0].id:accountId;
  } else selected=accountId;
  hide('account',true);hide('dashboard',false);
  await refresh();
 }
 async function refresh() {
  if(!user || !selected) return;
  var target=selected,requestVersion=++version;
  clearPackage();$('package-name').textContent='Loading…';$('messages').textContent='';
  var results=await Promise.all([
   client.from('client_services').select('package_name,monthly_cost,contract_url,documentation_url').eq('client_id',target).maybeSingle(),
   client.from('messages').select('sender_id,body,created_at').eq('client_id',target).order('created_at',{ascending:false}).limit(100)
  ]);
  if(requestVersion!==version || selected!==target || !user) return;
  var service=check(results[0]),messages=check(results[1]);
  $('package-name').textContent=service && service.package_name ? service.package_name : 'Not assigned';
  $('monthly-cost').textContent=service && service.package_name ? money(service.monthly_cost) : '—';
  if(service) {
   $('package-input').value=service.package_name;$('cost-input').value=service.monthly_cost;
   $('contract-input').value=service.contract_url;$('documentation-input').value=service.documentation_url;
   links.contract=validLink(service.contract_url);links.documentation=validLink(service.documentation_url);
  }
  $('links-note').textContent=(!links.contract || !links.documentation)?'Your team will add any missing document links.':'';
  syncCopyButtons();
  messages.reverse().forEach(function(message){var box=document.createElement('div');box.className='message'+(message.sender_id!==target?' staff':'');var author=document.createElement('small');author.textContent=(names[message.sender_id] || (message.sender_id===target?'Client':'Quill & Ink staff'))+' · '+new Date(message.created_at).toLocaleString();var body=document.createElement('p');body.textContent=message.body;box.appendChild(author);box.appendChild(body);$('messages').appendChild(box);});
  if(!messages.length)$('messages').textContent='Start your private discussion below.';
  $('messages').scrollTop=$('messages').scrollHeight;
 }
 async function accountAction(data) {
  var controller=typeof AbortController!=='undefined'?new AbortController():null;
  var timer=controller?setTimeout(function(){controller.abort();},20000):null;
  try {
   var requestHeaders={'Content-Type':'application/json',apikey:config.supabasePublishableKey};
   if(data.action==='staff-reset' || data.action==='change-temporary') {
    var currentSession=check(await client.auth.getSession()).session;
    if(!currentSession)throw new Error('Sign in again.');
    requestHeaders.Authorization='Bearer '+currentSession.access_token;
   }
   var response=await fetch(config.supabaseUrl+'/functions/v1/accounts',{method:'POST',headers:requestHeaders,body:JSON.stringify(data),signal:controller?controller.signal:undefined});
   var body=await response.json();
   if(!response.ok)throw new Error(body.error || 'Account service failed. Check that the accounts function is deployed.');
   return body;
  } finally {if(timer)clearTimeout(timer);}
 }
 try {
  if(!window.supabase || !config) throw new Error('Portal files could not load. Check the vendor and configuration files.');
  // Refuse a silent in-memory session: the phone must support durable storage.
  localStorage.setItem('quill-portal-storage-check','ok');localStorage.removeItem('quill-portal-storage-check');
  client=window.supabase.createClient(config.supabaseUrl,config.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:'quill-test-auth-v1'}});
 } catch(error) {status('This browser cannot initialise the portal: '+error.message);$('auth-submit').disabled=true;return;}
 document.querySelectorAll('[data-mode]').forEach(function(button){button.onclick=function(){setMode(button.dataset.mode);};});
 $('auth-form').onsubmit=function(event){event.preventDefault();run(async function(){
  status('');var username=$('username').value.trim().toLowerCase(),password=$('password').value;
  if(mode==='login') {
   var result=await client.auth.signInWithPassword({email:username+'@accounts.quill-ink.invalid',password:password});
   if(result.error)throw new Error('Could not sign in. Check your username and password.');
   $('password').value='';await loadDashboard(result.data.session);
  } else {
   var result=await accountAction({action:mode,username:username,password:password,displayName:$('display-name').value,recoveryCode:$('recovery-input').value});
   $('password').value='';$('recovery-input').value='';$('recovery-output').value=result.recoveryCode;
   hide('account',true);hide('recovery-result',false);status('Save the code, then sign in with your password.');
  }
 });};
 $('recovery-saved').onclick=function(){$('recovery-output').value='';hide('recovery-result',true);hide('account',false);setMode('login');};
 $('client-select').onchange=function(){hide('staff-reset-result',true);$('issued-password').value='';$('issued-code').value='';$('verification-note').value='';$('identity-confirmed').checked=false;selected=this.value;status('');run(refresh);};
 $('refresh').onclick=function(){status('');run(refresh);};
 $('logout').onclick=function(){run(async function(){check(await client.auth.signOut({scope:'local'}));clearDashboard();status('Signed out.');});};
 $('staff-reset-form').onsubmit=function(event){event.preventDefault();run(async function(){
  if(!staff || !selected || selected===user.id)throw new Error('Select another customer. You cannot reset your own account here.');
  if(!$('identity-confirmed').checked)throw new Error('Verify the account owner first.');
  var result=await accountAction({action:'staff-reset',targetId:selected,reason:$('verification-note').value.trim()});
  $('issued-password').value=result.temporaryPassword;$('issued-code').value=result.recoveryCode;hide('staff-reset-result',false);status('Reset recorded. Deliver the temporary credentials privately to the verified owner.');
 });};
 $('dismiss-credentials').onclick=function(){hide('staff-reset-result',true);$('issued-password').value='';$('issued-code').value='';$('verification-note').value='';$('identity-confirmed').checked=false;};
 $('temporary-form').onsubmit=function(event){event.preventDefault();run(async function(){
  var result=await accountAction({action:'change-temporary',currentPassword:$('current-temporary').value,password:$('permanent-password').value});
  check(await client.auth.signOut({scope:'local'}));clearDashboard();hide('account',true);hide('password-change',true);
  $('recovery-output').value=result.recoveryCode;hide('recovery-result',false);status('Password updated. Save your replacement recovery code, then sign in again.');
 });};
 $('temporary-logout').onclick=function(){run(async function(){check(await client.auth.signOut({scope:'local'}));clearDashboard();status('Signed out.');});};
 function validLink(value) {
  try {var url=new URL(value);return url.protocol==='https:' && url.hostname && !url.username && !url.password ? url.href : '';} catch(error) {return '';}
 }
 async function copyLink(kind) {
  var value=links[kind];if(!value)return;
  hide('manual-copy-label',true);
  try {if(!navigator.clipboard || !navigator.clipboard.writeText)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(value);status('');toast(kind==='contract'?'Contract link copied.':'Documentation link copied.');return;}catch(error){}
  $('manual-copy').value=value;hide('manual-copy-label',false);$('manual-copy').focus();$('manual-copy').select();
  try {if(document.execCommand('copy')){hide('manual-copy-label',true);status('');toast(kind==='contract'?'Contract link copied.':'Documentation link copied.');return;}}catch(error){}
  status('Automatic copying is unavailable in this browser. Copy the selected link manually.');toast('Copy the selected link manually.',true);
 }
 $('copy-contract').onclick=function(){copyLink('contract');};
 $('copy-documentation').onclick=function(){copyLink('documentation');};
 $('service-form').onsubmit=function(event){event.preventDefault();run(async function(){
  if(!staff || !selected)throw new Error('Staff access required.');
  var contract=$('contract-input').value.trim(),documentation=$('documentation-input').value.trim();
  if((contract && !validLink(contract)) || (documentation && !validLink(documentation)))throw new Error('Use full HTTPS document links without embedded usernames or passwords.');
  var packageName=$('package-input').value.trim(),cost=Number($('cost-input').value);
  if(!packageName && cost!==0)throw new Error('Enter a package name or set the monthly cost to zero.');
  check(await client.from('client_services').upsert({client_id:selected,package_name:packageName,monthly_cost:cost,contract_url:contract,documentation_url:documentation,updated_by:user.id},{onConflict:'client_id'}));
  await refresh();status('Package details saved.');
 });};
 $('message-form').onsubmit=function(event){event.preventDefault();run(async function(){
  if(!user || !selected)throw new Error('Please sign in again.');
  var body=$('message').value.trim();if(!body)throw new Error('Enter a message.');
  check(await client.from('messages').insert({client_id:selected,sender_id:user.id,body:body}));
  $('message').value='';await refresh();status('Message sent.');
 });};
 client.auth.onAuthStateChange(function(event,session){
  if(event==='SIGNED_OUT'){clearDashboard();}
  // Keep database work outside the synchronous auth callback.
  if(event==='SIGNED_IN' && user && user.id!==session.user.id)setTimeout(function(){run(function(){return loadDashboard(session);});},0);
 });
 setMode('login');
 run(async function(){var data=check(await client.auth.getSession());await loadDashboard(data.session);});
}());
