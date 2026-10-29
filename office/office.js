(function(){
  "use strict";
  var STORAGE_KEY="hariom-office-workspace-v1";
  var view="overview";
  var labels={overview:"Overview",projects:"Projects",estimates:"Estimates",diary:"Site diary",attendance:"Attendance"};
  var actionLabels={overview:"＋ New project",projects:"＋ New project",estimates:"＋ New estimate",diary:"＋ New site report",attendance:"＋ Mark attendance"};
  var quickActions={overview:"add-project",projects:"add-project",estimates:"add-estimates",diary:"add-diary",attendance:"add-attendance"};
  var state=loadState();
  var content=document.getElementById("office-content");
  var modalRoot=document.getElementById("modal-root");
  var actionButton=document.getElementById("top-action");
  var today=new Date();
  document.getElementById("today-label").textContent=new Intl.DateTimeFormat("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"}).format(today);

  function loadState(){
    try{
      var saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}");
      return {projects:Array.isArray(saved.projects)?saved.projects:[],quotes:Array.isArray(saved.quotes)?saved.quotes:[],reports:Array.isArray(saved.reports)?saved.reports:[],attendance:Array.isArray(saved.attendance)?saved.attendance:[]};
    }catch(error){return {projects:[],quotes:[],reports:[],attendance:[]};}
  }
  function persist(){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
    catch(error){toast("Could not save data in this browser.");}
    render();
  }
  function esc(value){
    return String(value==null?"":value).replace(/[&<>"']/g,function(character){
      return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[character];
    });
  }
  function money(value){
    return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(value)||0);
  }
  function dateText(value){
    if(!value)return "—";
    var parsed=new Date(value+"T00:00:00");
    return isNaN(parsed.getTime())?esc(value):new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"short",year:"numeric"}).format(parsed);
  }
  function statusClass(value){return String(value||"planning").toLowerCase().replace(/\s+/g,"-");}
  function toast(message){
    var old=document.querySelector(".toast");
    if(old)old.remove();
    var item=document.createElement("div");
    item.className="toast";
    item.textContent=message;
    document.body.appendChild(item);
    window.setTimeout(function(){item.remove();},2800);
  }
  function setView(next){
    view=next;
    document.querySelectorAll(".side-link").forEach(function(button){button.classList.toggle("active",button.getAttribute("data-view")===view);});
    document.getElementById("view-label").textContent=labels[view];
    actionButton.textContent=actionLabels[view];
    actionButton.setAttribute("data-action",quickActions[view]);
    render();
  }
  function heading(kicker,title,subtitle,buttonLabel,buttonAction){
    return "<div class='page-heading'><div><p class='overline'>"+esc(kicker)+"</p><h1>"+esc(title)+"</h1><p>"+esc(subtitle)+"</p></div>"+(buttonLabel?"<button class='primary-button' data-action='"+esc(buttonAction)+"'>"+esc(buttonLabel)+"</button>":"")+"</div>";
  }
  function empty(title,message){
    return "<div class='empty-state'><strong>"+esc(title)+"</strong>"+esc(message)+"</div>";
  }
  function projectSelect(){
    if(!state.projects.length)return "<option value=''>Create a project first</option>";
    return "<option value=''>Select project</option>"+state.projects.map(function(project){return "<option value='"+esc(project.id)+"'>"+esc(project.name)+"</option>";}).join("");
  }
  function projectById(id){return state.projects.find(function(project){return project.id===id;});}
  function projectName(id){var project=projectById(id);return project?project.name:"General / unassigned";}
  function statusPill(status){return "<span class='status-pill "+statusClass(status)+"'>"+esc(status||"Planning")+"</span>";}
  function renderOverview(){
    var active=state.projects.filter(function(project){return project.status==="Active";}).length;
    var month=localDate().slice(0,7);
    var reportsThisMonth=state.reports.filter(function(report){return (report.date||"").slice(0,7)===month;}).length;
    var headcount=state.attendance.filter(function(record){return record.date===localDate()&&record.status==="Present";}).length;
    var cards=[
      ["Active projects",active,"Across your project list","▦"],
      ["Estimates created",state.quotes.length,"Saved to this workspace","▤"],
      ["Site reports",reportsThisMonth,"Reports this month","▧"],
      ["Present today",headcount,"Attendance entries","◉"]
    ];
    var projectRows=state.projects.slice(0,5).map(function(project){
      return "<div class='project-row'><div><div class='project-name'>"+esc(project.name)+"</div><div class='project-sub'>"+esc(project.client||"Client not set")+"</div></div><div class='project-location'>"+esc(project.location||"—")+"</div>"+statusPill(project.status)+"</div>";
    }).join("");
    var recent=state.reports.slice().sort(function(a,b){return (b.date||"").localeCompare(a.date||"");}).slice(0,4).map(function(report){
      return "<div class='activity-item'><span class='activity-icon'>▧</span><div><strong>"+esc(projectName(report.projectId))+"</strong><small>"+dateText(report.date)+" · "+esc(report.work||"Site report")+"</small></div></div>";
    }).join("");
    return "<div class='page-heading'><div><p class='overline'>OFFICE OVERVIEW</p><h1>Good work starts here.</h1><p>Projects, field activity and commercial work in one place.</p></div><button class='secondary-button' data-action='export-backup'>↓ Export backup</button></div>"+
      "<div class='summary-grid'>"+cards.map(function(card){return "<article class='summary-card'><div class='summary-top'><span>"+esc(card[0])+"</span><span class='summary-icon'>"+card[3]+"</span></div><div class='summary-value'>"+esc(card[1])+"</div><div class='summary-note'>"+esc(card[2])+"</div></article>";}).join("")+"</div>"+
      "<div class='workspace-grid'><section class='panel'><div class='panel-head'><h2>Project register</h2><button data-action='navigate-projects'>VIEW ALL ↗</button></div><div class='panel-body'>"+(projectRows||empty("No projects yet","Add your first project to start tracking work."))+"</div></section>"+
      "<section class='panel'><div class='panel-head'><h2>Recent site activity</h2><button data-action='navigate-diary'>OPEN DIARY ↗</button></div><div class='panel-body'>"+(recent||empty("No site reports yet","Add a site report to keep a record of field activity."))+"</div></section></div>"+
      "<div class='notice-strip'><span>i</span><p><strong>Workspace data stays in this browser.</strong> Download a backup regularly. Shared office access and sign-in can be connected when a secure database is configured.</p><button class='quiet-button' data-action='export-backup'>Download backup</button></div>";
  }
  function renderProjects(){
    var items=state.projects.map(function(project){
      return "<article class='data-card project-card'><div class='data-card-top'>"+statusPill(project.status)+"<span class='card-date'>"+dateText(project.startDate)+"</span></div><h3>"+esc(project.name)+"</h3><p>"+esc(project.client||"Client not set")+" · "+esc(project.location||"Location not set")+"</p><div class='data-card-meta'><div><small>Budget / value</small><strong>"+(project.budget?money(project.budget):"Not entered")+"</strong></div><div><small>Started</small><strong>"+dateText(project.startDate)+"</strong></div></div><div class='card-actions'><button class='quiet-button' data-action='project-report' data-id='"+esc(project.id)+"'>＋ Site report</button><button class='quiet-button' data-action='delete-project' data-id='"+esc(project.id)+"'>Remove</button></div></article>";
    }).join("");
    return heading("PROJECT REGISTER","Projects","Track active scopes, clients, locations and project status.","＋ New project","add-project")+
      "<div class='toolbar'><span class='filter-count'>"+state.projects.length+" project"+(state.projects.length===1?"":"s")+"</span><div class='search-box'><input id='project-search' type='search' placeholder='Search project or client'></div></div>"+
      (items?"<div class='card-grid' id='project-grid'>"+items+"</div>":"<section class='panel'>"+empty("Your project register is ready","Add a project to keep its client, location, status and value together.")+"</section>");
  }
  function renderEstimates(){
    var items=state.quotes.slice().sort(function(a,b){return (b.createdAt||"").localeCompare(a.createdAt||"");}).map(function(quote){
      return "<article class='data-card quote-card'><div class='data-card-top'><span class='overline'>"+esc(quote.number)+"</span><span class='card-date'>"+dateText(quote.date)+"</span></div><h3>"+esc(quote.title||"Estimate")+"</h3><p>Prepared for "+esc(quote.client||"Client not set")+"</p><div class='quote-total'>"+money(quote.total)+" <small>including "+esc(quote.gst)+"% GST</small></div><div class='card-actions'><button class='quiet-button' data-action='print-quote' data-id='"+esc(quote.id)+"'>Print / save PDF ↗</button><button class='quiet-button' data-action='delete-quote' data-id='"+esc(quote.id)+"'>Remove</button></div></article>";
    }).join("");
    return heading("COMMERCIAL","Estimates","Create a priced estimate and print it or save it as a PDF.","＋ New estimate","add-estimates")+
      (items?"<div class='quote-grid'>"+items+"</div>":"<section class='panel'>"+empty("No estimates saved","Build your first estimate with line items, rates and optional GST.")+"</section>");
  }
  function renderDiary(){
    var rows=state.reports.slice().sort(function(a,b){return (b.date||"").localeCompare(a.date||"");}).map(function(report){
      return "<div class='record-row'><span><strong>"+esc(projectName(report.projectId))+"</strong><small>"+dateText(report.date)+"</small></span><span>"+esc(report.work||"—")+"</span><span>"+esc(report.crew||"—")+" people</span><span>"+esc(report.issues||"No issues noted")+"</span></div>";
    }).join("");
    return heading("FIELD OPERATIONS","Site diary","Record completed work, crew size and issues for each site day.","＋ New site report","add-diary")+
      "<div class='toolbar'><span class='filter-count'>"+state.reports.length+" site report"+(state.reports.length===1?"":"s")+"</span><button class='quiet-button' data-action='export-reports'>↓ Export CSV</button></div>"+
      (rows?"<section class='record-list'><div class='record-head'><span>Project / date</span><span>Work completed</span><span>Crew</span><span>Issues / notes</span></div>"+rows+"</section>":"<section class='panel'>"+empty("The site diary is empty","Add a daily report to keep field activity and follow-ups in view.")+"</section>");
  }
  function renderAttendance(){
    var rows=state.attendance.slice().sort(function(a,b){return (b.date||"").localeCompare(a.date||"");}).map(function(record){
      return "<div class='record-row'><span><strong>"+esc(record.name)+"</strong><small>"+esc(record.role||"Role not set")+"</small></span><span>"+esc(projectName(record.projectId))+"</span><span>"+dateText(record.date)+"</span><span>"+statusPill(record.status)+"</span></div>";
    }).join("");
    var present=state.attendance.filter(function(record){return record.date===localDate()&&record.status==="Present";}).length;
    return heading("PEOPLE","Attendance","Log daily attendance against a project or work location.","＋ Mark attendance","add-attendance")+
      "<div class='toolbar'><span class='filter-count'>"+present+" present · "+state.attendance.length+" total records</span><button class='quiet-button' data-action='export-attendance'>↓ Export CSV</button></div>"+
      (rows?"<section class='record-list'><div class='record-head'><span>Person / role</span><span>Project</span><span>Date</span><span>Status</span></div>"+rows+"</section>":"<section class='panel'>"+empty("No attendance recorded","Add a person and attendance status to start today's register.")+"</section>");
  }
  function render(){
    var screens={overview:renderOverview,projects:renderProjects,estimates:renderEstimates,diary:renderDiary,attendance:renderAttendance};
    content.innerHTML=screens[view]();
  }
  function openModal(title,body,wide){
    modalRoot.innerHTML="<div class='modal-backdrop' data-action='backdrop-close'><section class='modal"+(wide?" wide":"")+"' role='dialog' aria-modal='true' aria-label='"+esc(title)+"'><header class='modal-head'><h2>"+esc(title)+"</h2><button class='close-button' data-action='close-modal' aria-label='Close'>×</button></header>"+body+"</section></div>";
    var first=modalRoot.querySelector("input,select,textarea");
    if(first)first.focus();
  }
  function closeModal(){modalRoot.innerHTML="";}
  function field(label,name,placeholder,type,required,value){
    return "<div class='field'><label for='field-"+esc(name)+"'>"+esc(label)+"</label><input id='field-"+esc(name)+"' name='"+esc(name)+"' type='"+(type||"text")+"' placeholder='"+esc(placeholder||"")+"'"+(required?" required":"")+(value?" value='"+esc(value)+"'":"")+"></div>";
  }
  function projectForm(){
    var body="<form class='modal-form' data-form='project'><div class='form-grid'>"+
      field("Project / scope name","name","e.g. City gas network extension","text",true)+
      field("Client / organisation","client","Client name","text",false)+
      field("Location","location","City, state","text",false)+
      "<div class='field'><label for='field-status'>Status</label><select id='field-status' name='status'><option>Planning</option><option selected>Active</option><option>On hold</option><option>Completed</option></select></div>"+
      field("Project value (₹)","budget","Optional","number",false)+field("Start date","startDate","","date",false)+
      "</div><div class='form-actions'><button type='button' class='quiet-button' data-action='close-modal'>Cancel</button><button class='primary-button' type='submit'>Save project</button></div></form>";
    openModal("Add a project",body,false);
  }
  function estimateForm(){
    var date=localDate();
    var body="<form class='modal-form' data-form='estimate'><div class='form-grid'>"+
      field("Client","client","Client / organisation","text",true)+field("Estimate title","title","e.g. Pipeline laying works","text",true)+
      field("Estimate date","date","","date",true,date)+
      "<div class='field'><label for='field-gst'>GST rate</label><select id='field-gst' name='gst'><option value='0'>0%</option><option value='5'>5%</option><option value='12'>12%</option><option selected value='18'>18%</option><option value='28'>28%</option></select></div>"+
      "<div class='field full'><label>Line items</label><div class='line-items'><div class='line-items-head'><span>Description</span><span>Qty</span><span>Rate (₹)</span><span></span></div><div id='quote-lines'><div class='line-item'><input name='description' placeholder='Work description' required><input name='quantity' type='number' min='0.01' step='0.01' value='1' aria-label='Quantity' required><input name='rate' type='number' min='0' step='0.01' placeholder='0.00' aria-label='Rate' required><button type='button' class='remove-line' data-action='remove-line' aria-label='Remove line'>×</button></div></div></div>"+
      "<button type='button' class='quiet-button' style='margin-top:8px' data-action='add-line'>＋ Add line</button><div class='estimate-live-total'><span>Estimate total incl. GST</span><strong id='live-total'>₹0</strong></div></div>"+
      "<div class='field full'><label for='field-notes'>Notes / terms</label><textarea id='field-notes' name='notes' placeholder='Optional payment or scope notes'></textarea></div>"+
      "</div><div class='form-actions'><button type='button' class='quiet-button' data-action='close-modal'>Cancel</button><button class='primary-button' type='submit'>Save estimate</button></div></form>";
    openModal("New estimate",body,true);
    updateEstimateTotal();
  }
  function siteReportForm(projectId){
    var date=localDate();
    var body="<form class='modal-form' data-form='report'><div class='form-grid'>"+
      "<div class='field full'><label for='field-projectId'>Project / site</label><select id='field-projectId' name='projectId'>"+projectSelect()+"</select></div>"+
      field("Report date","date","","date",true,date)+field("Crew on site","crew","Number of people","number",false)+
      "<div class='field full'><label for='field-work'>Work completed</label><textarea id='field-work' name='work' placeholder='Summary of work completed today' required></textarea></div>"+
      "<div class='field full'><label for='field-issues'>Issues / follow-up</label><textarea id='field-issues' name='issues' placeholder='Optional blockers, material needs or follow-up'></textarea></div>"+
      "</div><div class='form-actions'><button type='button' class='quiet-button' data-action='close-modal'>Cancel</button><button class='primary-button' type='submit'>Save site report</button></div></form>";
    openModal("New site report",body,false);
    if(projectId){var select=modalRoot.querySelector("[name='projectId']");if(select)select.value=projectId;}
  }
  function attendanceForm(){
    var date=localDate();
    var body="<form class='modal-form' data-form='attendance'><div class='form-grid'>"+
      field("Person's name","name","Full name","text",true)+field("Role / trade","role","e.g. Welder, supervisor","text",false)+
      "<div class='field'><label for='field-projectId'>Project / location</label><select id='field-projectId' name='projectId'>"+projectSelect()+"</select></div>"+
      "<div class='field'><label for='field-date'>Date</label><input id='field-date' name='date' type='date' value='"+date+"' required></div>"+
      "<div class='field full'><label for='field-status'>Attendance status</label><select id='field-status' name='status'><option selected>Present</option><option>Absent</option><option>Leave</option></select></div>"+
      "</div><div class='form-actions'><button type='button' class='quiet-button' data-action='close-modal'>Cancel</button><button class='primary-button' type='submit'>Save attendance</button></div></form>";
    openModal("Mark attendance",body,false);
  }
  function updateEstimateTotal(){
    var lines=Array.from(modalRoot.querySelectorAll(".line-item"));
    var subtotal=lines.reduce(function(total,row){
      var quantity=Number(row.querySelector("[name='quantity']").value)||0;
      var rate=Number(row.querySelector("[name='rate']").value)||0;
      return total+quantity*rate;
    },0);
    var gst=Number(modalRoot.querySelector("[name='gst']")&&modalRoot.querySelector("[name='gst']").value)||0;
    var output=modalRoot.querySelector("#live-total");
    if(output)output.textContent=money(subtotal*(1+gst/100));
  }
  function saveProject(form){
    var data=new FormData(form);
    state.projects.unshift({id:makeId(),name:data.get("name").trim(),client:data.get("client").trim(),location:data.get("location").trim(),status:data.get("status"),budget:Number(data.get("budget"))||0,startDate:data.get("startDate")||""});
    closeModal();persist();toast("Project saved.");
  }
  function saveEstimate(form){
    var data=new FormData(form);
    var rows=Array.from(form.querySelectorAll(".line-item"));
    var items=rows.map(function(row){return {description:row.querySelector("[name='description']").value.trim(),quantity:Number(row.querySelector("[name='quantity']").value)||0,rate:Number(row.querySelector("[name='rate']").value)||0};});
    var subtotal=items.reduce(function(total,item){return total+item.quantity*item.rate;},0);
    var gst=Number(data.get("gst"))||0;
    var number="HOC-"+new Date().getFullYear()+"-"+String(state.quotes.length+1).padStart(3,"0");
    state.quotes.unshift({id:makeId(),number:number,client:data.get("client").trim(),title:data.get("title").trim(),date:data.get("date"),gst:gst,items:items,subtotal:subtotal,total:subtotal*(1+gst/100),notes:data.get("notes").trim(),createdAt:new Date().toISOString()});
    closeModal();persist();toast("Estimate saved.");
  }
  function saveReport(form){
    var data=new FormData(form);
    state.reports.unshift({id:makeId(),projectId:data.get("projectId")||"",date:data.get("date"),crew:data.get("crew"),work:data.get("work").trim(),issues:data.get("issues").trim()});
    closeModal();persist();toast("Site report saved.");
  }
  function saveAttendance(form){
    var data=new FormData(form);
    state.attendance.unshift({id:makeId(),name:data.get("name").trim(),role:data.get("role").trim(),projectId:data.get("projectId")||"",date:data.get("date"),status:data.get("status")});
    closeModal();persist();toast("Attendance saved.");
  }
  function localDate(){
    var now=new Date();
    return now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0");
  }
  function makeId(){return "r"+Date.now().toString(36)+Math.random().toString(36).slice(2,7);}
  function csvCell(value){return "\""+String(value==null?"":value).replace(/"/g,"\"\"")+"\"";}
  function downloadFile(name,content,type){
    var blob=new Blob([content],{type:type});
    var url=URL.createObjectURL(blob);
    var link=document.createElement("a");
    link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();
    window.setTimeout(function(){URL.revokeObjectURL(url);},1000);
  }
  function exportCsv(kind){
    var rows=[];
    var filename="";
    if(kind==="reports"){
      filename="hari-om-site-diary.csv";
      rows=[["Date","Project","Work completed","Crew","Issues / follow-up"]].concat(state.reports.map(function(item){return [item.date,projectName(item.projectId),item.work,item.crew,item.issues];}));
    }else{
      filename="hari-om-attendance.csv";
      rows=[["Date","Name","Role","Project","Status"]].concat(state.attendance.map(function(item){return [item.date,item.name,item.role,projectName(item.projectId),item.status];}));
    }
    downloadFile(filename,rows.map(function(row){return row.map(csvCell).join(",");}).join("\r\n"),"text/csv;charset=utf-8");
    toast("CSV downloaded.");
  }
  function exportBackup(){
    downloadFile("hari-om-office-backup-"+localDate()+".json",JSON.stringify({exportedAt:new Date().toISOString(),workspace:state},null,2),"application/json");
    toast("Workspace backup downloaded.");
  }
  function printQuote(id){
    var quote=state.quotes.find(function(item){return item.id===id;});
    if(!quote)return;
    var lineRows=quote.items.map(function(item){return "<tr><td>"+esc(item.description)+"</td><td>"+esc(item.quantity)+"</td><td>"+money(item.rate)+"</td><td>"+money(item.quantity*item.rate)+"</td></tr>";}).join("");
    var popup=window.open("","_blank","width=850,height=900");
    if(!popup){toast("Allow pop-ups to print this estimate.");return;}
    popup.document.write("<!doctype html><html><head><title>"+esc(quote.number)+"</title><meta charset='utf-8'><style>body{font:14px Arial,sans-serif;color:#192820;padding:48px;max-width:800px;margin:auto}h1{font-size:28px;margin:0}small{color:#657268}.brand{font-weight:bold;letter-spacing:3px;color:#16372d}.top{display:flex;justify-content:space-between;border-bottom:2px solid #19382f;padding-bottom:24px}.meta{margin:30px 0;line-height:1.8}table{width:100%;border-collapse:collapse;margin-top:25px}th,td{text-align:left;padding:12px 9px;border-bottom:1px solid #ddd;font-size:12px}th{background:#f1f3e8}.right{text-align:right}.total{margin:20px 0 0 auto;width:270px;line-height:2}.notes{margin-top:40px;white-space:pre-wrap;color:#627168}.foot{margin-top:60px;border-top:1px solid #ddd;padding-top:15px;color:#78837a;font-size:11px}@media print{body{padding:0}}</style></head><body><div class='top'><div><div class='brand'>HARI OM CONSTRUCTION</div><p><small>Pipeline infrastructure · Manpower · O&amp;M</small></p></div><div style='text-align:right'><small>ESTIMATE</small><h1>"+esc(quote.number)+"</h1></div></div><div class='meta'><strong>Prepared for:</strong> "+esc(quote.client)+"<br><strong>Scope:</strong> "+esc(quote.title)+"<br><strong>Date:</strong> "+dateText(quote.date)+"</div><table><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th class='right'>Amount</th></tr></thead><tbody>"+lineRows+"</tbody></table><div class='total'>Subtotal: <span style='float:right'>"+money(quote.subtotal)+"</span><br>GST ("+esc(quote.gst)+"%): <span style='float:right'>"+money(quote.total-quote.subtotal)+"</span><hr>Total: <strong style='float:right'>"+money(quote.total)+"</strong></div><div class='notes'>"+esc(quote.notes||"")+"</div><div class='foot'>Hari Om Construction · +91 97170 22779 · Shop No-17, Pocket-18, Sector-24, Rohini, Delhi-110085</div><script>window.onload=function(){window.print();};<\/script></body></html>");
    popup.document.close();
  }
  function handleAction(action,target){
    if(action==="add-project")projectForm();
    else if(action==="add-estimates")estimateForm();
    else if(action==="add-diary")siteReportForm("");
    else if(action==="add-attendance")attendanceForm();
    else if(action==="close-modal")closeModal();
    else if(action==="backdrop-close"&&target.classList.contains("modal-backdrop"))closeModal();
    else if(action==="navigate-projects")setView("projects");
    else if(action==="navigate-diary")setView("diary");
    else if(action==="add-line"){
      var holder=modalRoot.querySelector("#quote-lines");
      if(holder)holder.insertAdjacentHTML("beforeend","<div class='line-item'><input name='description' placeholder='Work description' required><input name='quantity' type='number' min='0.01' step='0.01' value='1' aria-label='Quantity' required><input name='rate' type='number' min='0' step='0.01' placeholder='0.00' aria-label='Rate' required><button type='button' class='remove-line' data-action='remove-line' aria-label='Remove line'>×</button></div>");
      updateEstimateTotal();
    }else if(action==="remove-line"){
      var lines=modalRoot.querySelectorAll(".line-item");
      if(lines.length>1)target.closest(".line-item").remove();
      updateEstimateTotal();
    }else if(action==="export-backup")exportBackup();
    else if(action==="export-reports")exportCsv("reports");
    else if(action==="export-attendance")exportCsv("attendance");
    else if(action==="project-report")siteReportForm(target.getAttribute("data-id"));
    else if(action==="print-quote")printQuote(target.getAttribute("data-id"));
    else if(action==="delete-project"){
      var projectId=target.getAttribute("data-id");
      if(window.confirm("Remove this project from the register? Existing reports and attendance remain saved.")){
        state.projects=state.projects.filter(function(item){return item.id!==projectId;});persist();toast("Project removed.");
      }
    }else if(action==="delete-quote"){
      var quoteId=target.getAttribute("data-id");
      if(window.confirm("Remove this estimate?")){state.quotes=state.quotes.filter(function(item){return item.id!==quoteId;});persist();toast("Estimate removed.");}
    }
  }
  document.addEventListener("click",function(event){
    var nav=event.target.closest("[data-view]");
    if(nav){setView(nav.getAttribute("data-view"));return;}
    var action=event.target.closest("[data-action]");
    if(action){
      if(action.getAttribute("data-action")==="backdrop-close"&&event.target!==action)return;
      handleAction(action.getAttribute("data-action"),action);
    }
  });
  document.addEventListener("submit",function(event){
    var kind=event.target.getAttribute("data-form");
    if(!kind)return;
    event.preventDefault();
    if(kind==="project")saveProject(event.target);
    if(kind==="estimate")saveEstimate(event.target);
    if(kind==="report")saveReport(event.target);
    if(kind==="attendance")saveAttendance(event.target);
  });
  modalRoot.addEventListener("input",function(event){
    if(event.target.closest("[data-form='estimate']"))updateEstimateTotal();
  });
  modalRoot.addEventListener("change",function(event){
    if(event.target.closest("[data-form='estimate']"))updateEstimateTotal();
  });
  content.addEventListener("input",function(event){
    if(event.target.id==="project-search"){
      var query=event.target.value.toLowerCase();
      content.querySelectorAll(".project-card").forEach(function(card){card.hidden=!card.textContent.toLowerCase().includes(query);});
    }
  });
  render();
})();

