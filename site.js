(function(){
  var menuButton=document.querySelector(".menu-toggle");
  var nav=document.querySelector(".main-nav");
  menuButton.addEventListener("click",function(){
    var open=nav.classList.toggle("open");
    menuButton.setAttribute("aria-expanded",String(open));
    menuButton.setAttribute("aria-label",open?"Close navigation":"Open navigation");
  });
  nav.querySelectorAll("a").forEach(function(link){
    link.addEventListener("click",function(){
      nav.classList.remove("open");
      menuButton.setAttribute("aria-expanded","false");
    });
  });
  document.getElementById("year").textContent=new Date().getFullYear();
  document.getElementById("enquiry-form").addEventListener("submit",function(event){
    event.preventDefault();
    var form=new FormData(event.currentTarget);
    var message=[
      "Hari Om Construction enquiry",
      "Name: "+form.get("name"),
      "Phone: "+form.get("phone"),
      "Service: "+form.get("service"),
      "Scope: "+(form.get("message")||"Not provided")
    ].join("\n");
    window.open("https://wa.me/919717022779?text="+encodeURIComponent(message),"_blank","noopener");
  });
})();

