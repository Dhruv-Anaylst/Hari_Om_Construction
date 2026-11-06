(function () {
  var page = document.body.getAttribute("data-page") || "home";
  var navigation = [
    ["Company", "about.html", "about"],
    ["Services", "services.html", "services"],
    ["Projects", "projects.html", "projects"],
    ["Quality & safety", "quality.html", "quality"],
    ["Gallery", "gallery.html", "gallery"],
    ["Careers", "careers.html", "careers"],
    ["Contact", "contact.html", "contact"]
  ];
  var mark = '<span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span><span class="brand-copy"><strong>HARI OM</strong><small>CONSTRUCTION</small></span>';
  var header = document.querySelector(".site-header");
  var footer = document.querySelector(".site-footer");

  if (header) {
    header.innerHTML = '<a class="brand" href="index.html" aria-label="Hari Om Construction home">' + mark + '</a>' +
      '<button class="menu-toggle" type="button" aria-label="Open navigation" aria-expanded="false"><span></span><span></span></button>' +
      '<nav class="main-nav" aria-label="Main navigation">' + navigation.map(function (item) {
        return '<a href="' + item[1] + '"' + (page === item[2] ? ' aria-current="page"' : '') + '>' + item[0] + '</a>';
      }).join("") + '</nav><a class="nav-cta" href="contact.html">Discuss a project <span aria-hidden="true">↗</span></a>';
  }

  if (footer) {
    footer.innerHTML = '<a class="brand footer-brand" href="index.html" aria-label="Hari Om Construction home">' + mark + '</a>' +
      '<p>Pipeline infrastructure and field teams<br>for the networks that keep India moving.</p>' +
      '<nav class="footer-links" aria-label="Footer navigation"><a href="about.html">Company</a><a href="services.html">Services</a><a href="projects.html">Project scopes</a><a href="quality.html">Quality &amp; safety</a><a href="gallery.html">Gallery</a><a href="careers.html">Careers</a><a href="contact.html">Contact</a><a href="https://tools.hariomconstruction.in">Office tools ↗</a></nav>' +
      '<div class="footer-bottom"><span>© <span data-current-year></span> Hari Om Construction</span><a href="#top">Back to top ↑</a><span>Delhi · India</span></div>' +
      '<div class="footer-credit">Developed &amp; maintained by Hari Om Projects ft. Dhruv Agnihotri</div>';
  }

  var menuButton = document.querySelector(".menu-toggle");
  var nav = document.querySelector(".main-nav");
  if (menuButton && nav) {
    menuButton.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
      });
    });
  }

  document.querySelectorAll("[data-current-year]").forEach(function (node) {
    node.textContent = new Date().getFullYear();
  });

  document.querySelectorAll("form[data-wa-form], #enquiry-form").forEach(function (formElement) {
    formElement.addEventListener("submit", function (event) {
      event.preventDefault();
      var form = new FormData(formElement);
      var lines = ["Hari Om Construction enquiry"];
      form.forEach(function (value, key) {
        if (String(value).trim()) lines.push(key.replace(/[_-]/g, " ").replace(/^./, function (letter) { return letter.toUpperCase(); }) + ": " + value);
      });
      window.open("https://wa.me/919717022779?text=" + encodeURIComponent(lines.join("\n")), "_blank", "noopener");
    });
  });
})();

