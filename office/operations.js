(function(){
  "use strict";
  var KEY="hariom-office-operations-v1";
  var MAIN_KEY="hariom-office-workspace-v1";
  var content=document.getElementById("office-content");
  var modal=document.getElementById("modal-root");
  var label=document.getElementById("view-label");
  var topAction=document.getElementById("top-action");
  var activeView="";
  var state=load();

  function load(){
    try{
      var saved=JSON.parse(localStorage.getItem(KEY)||"{}");
      return {expenses:Array.isArray(saved.expenses)?saved.expenses:[],materials:Array.isArray(saved.materials)?saved.materials:[],movements:Array.isArray(saved.movements)?saved.movements:[]};
    }catch(error){return {expenses:[],materials:[],movements:[]};}
  }
  function persist(){
    try{localStorage.setItem(KEY,JSON.stringify(state));}catch(error){notify("Could not save operations data in this browser.");}
    render();
  }
  function esc(value){return String(value==null?"":value).replace(/[&<>"']/g,function(character){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[character];});}
  function localDate(){var now=new Date();return now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0");}
  function monthKey(){return localDate().slice(0,7);}
  function money(value){return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(value)||0);}
  function fmtDate(value){if(!value)return "—";var date=new Date(value+"T00:00:00");return isNaN(date.getTime())?esc(value):new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"short",year:"numeric"}).format(date);}
  function makeId(){return "o"+Date.now().toString(36)+Math.random().toString(36).slice(2,7);}
  function notify(message){var old=document.querySelector(".toast");if(old)old.remove();var node=document.createElement("div");node.className="toast";node.textContent=message;document.body.appendChild(node);window.setTimeout(function(){node.remove();},2800);}
  function getProjects(){try{var stored=JSON.parse(localStorage.getItem(MAIN_KEY)||"{}");return Array.isArray(stored.projects)?stored.projects:[];}catch(error){return [];}}
  function projectOptions(){var projects=getProjects();return "<option value=''>General / unassigned</option>"+projects.map(function(project){return "<option value='"+esc(project.name)+"'>"+esc(project.name)+"</option>";}).join("");}
  function opHeading(kicker,title,subtitle,button,action){return "<div class='page-heading'><div><p class='overline'>"+esc(kicker)+"</p><h1>"+esc(title)+"</h1><p>"+esc(subtitle)+"</p></div>"+(button?"<button class='primary-button' data-operation-action='"+esc(action)+"'>"+esc(button)+"</button>":"")+"</div>";}
  function summary(title,value,note,icon){return "<article class='summary-card'><div class='summary-top'><span>"+esc(title)+"</span><span class='summary-icon'>"+icon+"</span></div><div class='summary-value'>"+esc(value)+"</div><div class='summary-note'>"+esc(note)+"</div></article>";}
  function download(name,content,type){var blob=new Blob([content],{type:type});var url=URL.createObjectURL(blob);var a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();window.setTimeout(function(){URL.revokeObjectURL(url);},1000);}
  function csvCell(value){return '"'+String(value==null?"":value).replace(/"/g,'""')+'"';}
  function exportCsv(rows,name){download(name,rows.map(function(row){return row.map(csvCell).join(",");}).join("\r\n"),"text/csv;charset=utf-8");notify("CSV downloaded.");}
  function statusChip(value){return "<span class='ops-status "+(value==="Paid"?"paid":"unpaid")+"'>"+esc(value)+"</span>";}
  function setView(next){
    activeView=next;
    document.querySelectorAll(".side-link").forEach(function(button){button.classList.toggle("active",button.getAttribute("data-operation-view")===activeView);});
    label.textContent=next==="expenses"?"Expenses":next==="materials"?"Materials & stock":"Calculators";
    topAction.hidden=true;
    render();
  }
  function renderExpenses(){
    var month=monthKey();
    var thisMonth=state.expenses.filter(function(item){return (item.date||"").slice(0,7)===month;});
    var monthTotal=thisMonth.reduce(function(sum,item){return sum+(Number(item.amount)||0);},0);
    var due=state.expenses.filter(function(item){return item.status==="Unpaid";}).reduce(function(sum,item){return sum+(Number(item.amount)||0);},0);
    var items=state.expenses.slice().sort(function(a,b){return (b.date||"").localeCompare(a.date||"");});
    var rows=items.map(function(item){return "<tr data-expense-row><td>"+fmtDate(item.date)+"</td><td><strong>"+esc(item.payee||"—")+"</strong><small>"+esc(item.category||"Other")+" · "+esc(item.project||"General / unassigned")+"</small></td><td>"+esc(item.mode||"—")+"</td><td>"+statusChip(item.status)+"</td><td class='ops-amount'>"+money(item.amount)+"</td><td><button class='row-action' data-operation-action='delete-expense' data-id='"+esc(item.id)+"' aria-label='Remove expense'>×</button></td></tr>";}).join("");
    return opHeading("COST CONTROL","Expense register","Track project spending, supplier payments and unpaid costs.","＋ Add expense","add-expense")+
      "<div class='summary-grid ops-summary-grid'>"+summary("Expenses this month",money(monthTotal),thisMonth.length+" entries","₹")+summary("Unpaid balance",money(due),"Across recorded expenses","↗")+summary("Total entries",state.expenses.length,"Saved in this browser","▤")+"</div>"+
      "<div class='toolbar'><span class='filter-count'>"+items.length+" expense"+(items.length===1?"":"s")+"</span><div class='search-box'><input id='expense-search' type='search' placeholder='Search payee, category or project'></div><button class='quiet-button' data-operation-action='export-expenses'>↓ Export CSV</button></div>"+
      "<div class='ops-table-wrap'><table class='ops-table'><thead><tr><th>Date</th><th>Payee / category / project</th><th>Paid by</th><th>Status</th><th class='ops-amount'>Amount</th><th></th></tr></thead><tbody>"+(rows||"<tr><td colspan='6' class='ops-empty'>No expenses yet. Add the first cost to start your project ledger.</td></tr>")+"</tbody></table></div>";
  }
  function renderMaterials(){
    var low=state.materials.filter(function(item){return Number(item.quantity)<=Number(item.reorderAt);});
    var qty=state.materials.reduce(function(sum,item){return sum+(Number(item.quantity)||0);},0);
    var cards=state.materials.map(function(item){var isLow=Number(item.quantity)<=Number(item.reorderAt);return "<article class='stock-card'><div class='stock-card-top'><span class='stock-tag'>"+esc(item.project||"GENERAL STORE")+"</span>"+(isLow?"<span class='stock-low'>LOW STOCK</span>":"<span class='stock-ok'>IN STOCK</span>")+"</div><h3>"+esc(item.name)+"</h3><p>"+esc(item.location||"Store location not set")+"</p><div class='stock-quantity'><strong>"+esc(item.quantity)+"</strong><span>"+esc(item.unit)+" available</span></div><div class='stock-minimum'>Reorder at "+esc(item.reorderAt)+" "+esc(item.unit)+"</div><div class='card-actions'><button class='quiet-button' data-operation-action='move-stock' data-id='"+esc(item.id)+"'>＋ / − Record movement</button><button class='quiet-button' data-operation-action='delete-material' data-id='"+esc(item.id)+"' aria-label='Remove item'>Remove</button></div></article>";}).join("");
    var movements=state.movements.slice().sort(function(a,b){return (b.date||"").localeCompare(a.date||"");}).slice(0,8).map(function(move){var item=state.materials.find(function(material){return material.id===move.materialId;});return "<tr><td>"+fmtDate(move.date)+"</td><td><strong>"+esc(item?item.name:"Removed item")+"</strong><small>"+esc(move.reference||"No note")+"</small></td><td><span class='ops-status "+(move.direction==="In"?"paid":"unpaid")+"'>Stock "+esc(move.direction)+"</span></td><td>"+esc(move.quantity)+" "+esc(item?item.unit:"")+"</td><td>"+esc(item?item.project||"General":"—")+"</td></tr>";}).join("");
    return opHeading("SITE STORES","Materials & stock","Track quantities on hand and record stock received or issued.","＋ Add material","add-material")+
      "<div class='summary-grid ops-summary-grid'>"+summary("Tracked items",state.materials.length,"Across all stores","▤")+summary("Low stock",low.length,"At or below reorder level","!")+summary("Recent movements",state.movements.length,"Stock in and stock out","↻")+"</div>"+
      "<div class='toolbar'><span class='filter-count'>"+qty+" total units across tracked items</span><div class='ops-toolbar-actions'><button class='quiet-button' data-operation-action='stock-movement' "+(state.materials.length?"":"disabled")+">＋ Stock in / out</button><button class='quiet-button' data-operation-action='export-materials'>↓ Export CSV</button></div></div>"+
      (cards?"<div class='stock-grid'>"+cards+"</div>":"<section class='panel'><div class='empty-state'><strong>No materials tracked yet</strong>Add an item with an opening balance and reorder threshold.</div></section>")+
      "<section class='panel ops-movement-panel'><div class='panel-head'><h2>Recent stock movements</h2><button data-operation-action='export-movements'>EXPORT CSV</button></div><div class='ops-table-wrap'><table class='ops-table'><thead><tr><th>Date</th><th>Item / note</th><th>Movement</th><th>Quantity</th><th>Project</th></tr></thead><tbody>"+(movements||"<tr><td colspan='5' class='ops-empty'>Stock movements will appear here.</td></tr>")+"</tbody></table></div></section>";
  }
  function renderCalculators(){
    return opHeading("QUICK TOOLS","Construction calculators","Fast planning estimates for tax, concrete, excavation and reinforcement.","","")+"<div class='calc-notice'>Indicative planning calculations only. Confirm quantities against approved drawings, specifications and site conditions.</div><div class='calc-grid'>"+
      "<section class='calc-card'><div class='calc-card-head'><span>01 / COMMERCIAL</span><h2>GST calculator</h2><p>Calculate tax and invoice total from a base amount.</p></div><div class='calc-fields'><label>Base amount (₹)<input type='number' min='0' step='0.01' data-calc='gst-base' placeholder='100000'></label><label>GST rate (%)<select data-calc='gst-rate'><option value='0'>0%</option><option value='5'>5%</option><option value='12'>12%</option><option selected value='18'>18%</option><option value='28'>28%</option></select></label></div><div class='calc-result'><span>GST amount</span><strong data-result='gst-tax'>₹0</strong><span>Total including GST</span><strong data-result='gst-total'>₹0</strong></div></section>"+
      "<section class='calc-card'><div class='calc-card-head'><span>02 / CONCRETE</span><h2>Concrete volume</h2><p>Estimate order volume with an optional allowance.</p></div><div class='calc-fields three'><label>Length (m)<input type='number' min='0' step='0.01' data-calc='conc-length' placeholder='10'></label><label>Width (m)<input type='number' min='0' step='0.01' data-calc='conc-width' placeholder='0.3'></label><label>Depth (m)<input type='number' min='0' step='0.01' data-calc='conc-depth' placeholder='0.2'></label><label>Allowance (%)<input type='number' min='0' step='0.1' value='5' data-calc='conc-waste'></label></div><div class='calc-result'><span>Volume with allowance</span><strong data-result='conc-total'>0.000 m³</strong><span>Approximate base volume</span><strong data-result='conc-base'>0.000 m³</strong></div></section>"+
      "<section class='calc-card'><div class='calc-card-head'><span>03 / EARTHWORK</span><h2>Excavation volume</h2><p>Estimate trench or pit volume from dimensions.</p></div><div class='calc-fields three'><label>Length (m)<input type='number' min='0' step='0.01' data-calc='exc-length' placeholder='100'></label><label>Width (m)<input type='number' min='0' step='0.01' data-calc='exc-width' placeholder='0.6'></label><label>Depth (m)<input type='number' min='0' step='0.01' data-calc='exc-depth' placeholder='1.2'></label></div><div class='calc-result'><span>Estimated excavation</span><strong data-result='exc-total'>0.000 m³</strong></div></section>"+
      "<section class='calc-card'><div class='calc-card-head'><span>04 / REINFORCEMENT</span><h2>Rebar weight</h2><p>Approximate steel weight using d² ÷ 162 kg/m.</p></div><div class='calc-fields'><label>Bar diameter (mm)<input type='number' min='1' step='1' data-calc='bar-diameter' placeholder='12'></label><label>Total bar length (m)<input type='number' min='0' step='0.1' data-calc='bar-length' placeholder='100'></label></div><div class='calc-result'><span>Estimated steel weight</span><strong data-result='bar-weight'>0.00 kg</strong></div></section>"+
      "</div>";
  }
  function render(){if(activeView==="expenses")content.innerHTML=renderExpenses();if(activeView==="materials")content.innerHTML=renderMaterials();if(activeView==="calculators"){content.innerHTML=renderCalculators();calculateAll();}}
  function openModal(title,form){modal.innerHTML="<div class='modal-backdrop ops-backdrop'><section class='modal' role='dialog' aria-modal='true' aria-label='"+esc(title)+"'><header class='modal-head'><h2>"+esc(title)+"</h2><button class='close-button' data-operation-action='close-modal' aria-label='Close'>×</button></header>"+form+"</section></div>";var first=modal.querySelector("input,select,textarea");if(first)first.focus();}
  function closeModal(){modal.innerHTML="";}
  function formField(labelText,name,type,placeholder,required,value){return "<div class='field'><label for='ops-"+esc(name)+"'>"+esc(labelText)+"</label><input id='ops-"+esc(name)+"' name='"+esc(name)+"' type='"+(type||"text")+"' placeholder='"+esc(placeholder||"")+"'"+(required?" required":"")+(value!=null?" value='"+esc(value)+"'":"")+"></div>";}
  function projectSelectField(){return "<div class='field'><label for='ops-project'>Project / site</label><select id='ops-project' name='project'><option value=''>General / unassigned</option>"+getProjects().map(function(item){return "<option>"+esc(item.name)+"</option>";}).join("")+"</select></div>";}
  function expenseForm(){
    var form="<form class='modal-form' data-operations-form='expense'><div class='form-grid'>"+formField("Date","date","date","",true,localDate())+projectSelectField()+
      "<div class='field'><label for='ops-category'>Category</label><select id='ops-category' name='category'><option>Materials</option><option>Equipment</option><option>Transport</option><option>Wages / labour</option><option>Fuel</option><option>Meals / site welfare</option><option>Utilities</option><option>Other</option></select></div>"+formField("Payee / supplier","payee","text","Name",true)+formField("Amount (₹)","amount","number","0.00",true)+
      "<div class='field'><label for='ops-mode'>Payment method</label><select id='ops-mode' name='mode'><option>Bank transfer</option><option>UPI</option><option>Cash</option><option>Card</option><option>Other</option></select></div><div class='field'><label for='ops-status'>Payment status</label><select id='ops-status' name='status'><option>Paid</option><option>Unpaid</option></select></div><div class='field full'><label for='ops-note'>Notes / reference</label><textarea id='ops-note' name='note' placeholder='Invoice number, purpose or reference'></textarea></div></div><div class='form-actions'><button type='button' class='quiet-button' data-operation-action='close-modal'>Cancel</button><button class='primary-button' type='submit'>Save expense</button></div></form>";
    openModal("Add expense",form);
  }
  function materialForm(){
    var form="<form class='modal-form' data-operations-form='material'><div class='form-grid'>"+formField("Material / item","name","text","e.g. 110 mm MDPE pipe",true)+projectSelectField()+formField("Store / location","location","text","e.g. Sector 24 site store",false)+
      "<div class='field'><label for='ops-unit'>Unit</label><select id='ops-unit' name='unit'><option>pcs</option><option>m</option><option>kg</option><option>tonne</option><option>bag</option><option>litre</option><option>set</option><option>other</option></select></div>"+formField("Opening quantity","quantity","number","0",true)+formField("Reorder level","reorderAt","number","Low-stock alert threshold",false,"0")+
      "</div><div class='form-actions'><button type='button' class='quiet-button' data-operation-action='close-modal'>Cancel</button><button class='primary-button' type='submit'>Save material</button></div></form>";
    openModal("Add material to stock",form);
  }
  function movementForm(materialId){
    var options=state.materials.map(function(item){return "<option value='"+esc(item.id)+"'>"+esc(item.name)+" · "+esc(item.project||"General")+" ("+esc(item.quantity)+" "+esc(item.unit)+")</option>";}).join("");
    var form="<form class='modal-form' data-operations-form='movement'><div class='form-grid'><div class='field full'><label for='ops-materialId'>Material</label><select id='ops-materialId' name='materialId' required>"+options+"</select></div><div class='field'><label for='ops-direction'>Movement</label><select id='ops-direction' name='direction'><option>In</option><option>Out</option></select></div>"+formField("Quantity","quantity","number","0",true)+formField("Date","date","date","",true,localDate())+formField("Reference / note","reference","text","Delivery, issue slip or reason",false)+"</div><div class='form-actions'><button type='button' class='quiet-button' data-operation-action='close-modal'>Cancel</button><button class='primary-button' type='submit'>Save movement</button></div></form>";
    openModal("Record stock movement",form);if(materialId){var select=modal.querySelector("[name='materialId']");if(select)select.value=materialId;}
  }
  function saveExpense(form){var data=new FormData(form),amount=Number(data.get("amount"));if(!(amount>0)){notify("Enter an amount greater than zero.");return;}state.expenses.unshift({id:makeId(),date:data.get("date"),project:data.get("project")||"",category:data.get("category"),payee:String(data.get("payee")).trim(),amount:amount,mode:data.get("mode"),status:data.get("status"),note:String(data.get("note")||"").trim()});closeModal();persist();notify("Expense saved.");}
  function saveMaterial(form){var data=new FormData(form),quantity=Number(data.get("quantity"));if(quantity<0){notify("Opening quantity cannot be negative.");return;}var item={id:makeId(),name:String(data.get("name")).trim(),project:data.get("project")||"",location:String(data.get("location")||"").trim(),unit:data.get("unit"),quantity:quantity,reorderAt:Number(data.get("reorderAt"))||0,updatedAt:new Date().toISOString()};state.materials.unshift(item);if(quantity>0)state.movements.unshift({id:makeId(),materialId:item.id,direction:"In",quantity:quantity,date:localDate(),reference:"Opening balance"});closeModal();persist();notify("Material added to stock.");}
  function saveMovement(form){var data=new FormData(form),item=state.materials.find(function(material){return material.id===data.get("materialId");}),quantity=Number(data.get("quantity")),direction=data.get("direction");if(!item){notify("Select a material item.");return;}if(!(quantity>0)){notify("Enter a quantity greater than zero.");return;}if(direction==="Out"&&quantity>Number(item.quantity)){notify("Stock out exceeds the available quantity.");return;}item.quantity=Number(item.quantity)+(direction==="In"?quantity:-quantity);item.updatedAt=new Date().toISOString();state.movements.unshift({id:makeId(),materialId:item.id,direction:direction,quantity:quantity,date:data.get("date"),reference:String(data.get("reference")||"").trim()});closeModal();persist();notify("Stock movement saved.");}
  function expenseCsv(){exportCsv([["Date","Project","Category","Payee","Amount INR","Method","Status","Notes"]].concat(state.expenses.map(function(item){return [item.date,item.project,item.category,item.payee,item.amount,item.mode,item.status,item.note];})),"hari-om-expenses.csv");}
  function materialsCsv(){exportCsv([["Item","Project","Location","Quantity","Unit","Reorder level","Updated"]].concat(state.materials.map(function(item){return [item.name,item.project,item.location,item.quantity,item.unit,item.reorderAt,item.updatedAt];})),"hari-om-material-stock.csv");}
  function movementsCsv(){exportCsv([["Date","Material","Project","Movement","Quantity","Unit","Reference"]].concat(state.movements.map(function(move){var item=state.materials.find(function(material){return material.id===move.materialId;});return [move.date,item?item.name:"Removed item",item?item.project:"",move.direction,move.quantity,item?item.unit:"",move.reference];})),"hari-om-stock-movements.csv");}
  function handleAction(action,target){
    if(action==="add-expense")expenseForm();else if(action==="add-material")materialForm();else if(action==="stock-movement")movementForm("");else if(action==="move-stock")movementForm(target.getAttribute("data-id"));else if(action==="close-modal")closeModal();
    else if(action==="export-expenses")expenseCsv();else if(action==="export-materials")materialsCsv();else if(action==="export-movements")movementsCsv();
    else if(action==="delete-expense"){var id=target.getAttribute("data-id");if(window.confirm("Remove this expense entry?")){state.expenses=state.expenses.filter(function(item){return item.id!==id;});persist();notify("Expense removed.");}}
    else if(action==="delete-material"){var materialId=target.getAttribute("data-id");if(window.confirm("Remove this material item? Its movement history will remain in exports.")){state.materials=state.materials.filter(function(item){return item.id!==materialId;});persist();notify("Material removed.");}}
  }
  function calculateAll(){
    function n(key){var input=content.querySelector("[data-calc='"+key+"']");return input?Number(input.value)||0:0;}
    function set(key,value){var node=content.querySelector("[data-result='"+key+"']");if(node)node.textContent=value;}
    var base=n("gst-base"),tax=base*n("gst-rate")/100;set("gst-tax",money(tax));set("gst-total",money(base+tax));
    var concrete=n("conc-length")*n("conc-width")*n("conc-depth");set("conc-base",concrete.toFixed(3)+" m³");set("conc-total",(concrete*(1+n("conc-waste")/100)).toFixed(3)+" m³");
    set("exc-total",(n("exc-length")*n("exc-width")*n("exc-depth")).toFixed(3)+" m³");
    set("bar-weight",((n("bar-diameter")*n("bar-diameter")/162)*n("bar-length")).toFixed(2)+" kg");
  }
  document.addEventListener("click",function(event){
    var nav=event.target.closest("[data-operation-view]");if(nav){event.preventDefault();setView(nav.getAttribute("data-operation-view"));return;}
    var action=event.target.closest("[data-operation-action]");if(action){if(action.getAttribute("data-operation-action")==="backdrop-close"&&event.target!==action)return;handleAction(action.getAttribute("data-operation-action"),action);}
  });
  document.addEventListener("submit",function(event){var form=event.target.getAttribute("data-operations-form");if(!form)return;event.preventDefault();if(form==="expense")saveExpense(event.target);if(form==="material")saveMaterial(event.target);if(form==="movement")saveMovement(event.target);});
  content.addEventListener("input",function(event){
    if(event.target.id==="expense-search"){var query=event.target.value.toLowerCase();content.querySelectorAll("[data-expense-row]").forEach(function(row){row.hidden=!row.textContent.toLowerCase().includes(query);});}
    if(event.target.matches("[data-calc]"))calculateAll();
  });
  content.addEventListener("change",function(event){if(event.target.matches("[data-calc]"))calculateAll();});
})();

