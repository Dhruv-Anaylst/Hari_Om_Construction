// Hariom Construction — shared site behaviour

document.addEventListener('DOMContentLoaded', function () {
  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var panel = document.querySelector('.mobile-panel');
  if (toggle && panel) {
    toggle.addEventListener('click', function () {
      var open = panel.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    panel.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        panel.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Footer year
  document.querySelectorAll('.js-year').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // Contact form -> mailto fallback (static site, no backend)
  var form = document.querySelector('.enquiry-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var name = data.get('name') || '';
      var company = data.get('company') || '';
      var email = data.get('email') || '';
      var phone = data.get('phone') || '';
      var service = data.get('service') || '';
      var message = data.get('message') || '';

      var body = [
        'Name: ' + name,
        'Company: ' + company,
        'Email: ' + email,
        'Phone: ' + phone,
        'Service interest: ' + service,
        '',
        message
      ].join('\n');

      var mailto = 'mailto:work@hariomconstruction.in'
        + '?subject=' + encodeURIComponent('Website enquiry from ' + name)
        + '&body=' + encodeURIComponent(body);

      window.location.href = mailto;
    });
  }
});
