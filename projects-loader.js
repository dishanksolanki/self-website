/* ============================================================
   PROJECTS LOADER
   Reads projects.json and builds the cards in #projectsGrid.
   To add a new project: open projects.json, add one object to
   the array, commit + push. Nothing else needs to change.
   ============================================================ */
(function () {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  fetch('./projects.json', { cache: 'no-store' })
    .then((res) => res.json())
    .then((projects) => {
      grid.innerHTML = projects.map((p, i) => buildCardHTML(p, i)).join('');
      wireUpCards();
    })
    .catch((err) => {
      console.error('Could not load projects.json', err);
      grid.innerHTML = '<p style="opacity:.6">Projects could not be loaded.</p>';
    });

  function buildCardHTML(project, index) {
    const idx = String(index + 1).padStart(2, '0');
    const tags = (project.tags || [])
      .map((t) => `<span class="ptag">${escapeHTML(t)}</span>`)
      .join('');
    const linkLabel = project.linkLabel
      ? `<span class="proj-link">${escapeHTML(project.linkLabel)}</span>`
      : '';

    return `
      <div class="proj-card fade-up" data-href="${escapeAttr(project.href)}">
        <div class="proj-idx">${idx}</div>
        <div class="proj-name">${escapeHTML(project.name)}</div>
        <p class="proj-desc">${escapeHTML(project.desc)}</p>
        <div class="proj-footer">
          <div class="proj-tags">${tags}</div>
          ${linkLabel}
        </div>
      </div>`;
  }

  function wireUpCards() {
    const cards = Array.from(grid.querySelectorAll('.proj-card'));

    // Click anywhere on a card to open its link in a new tab
    cards.forEach((card) => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        const url = card.getAttribute('data-href');
        if (url) window.open(url, '_blank', 'noopener');
      });
    });

    // Staggered fade-in as cards scroll into view
    cards.forEach((card) => { if (!prefersReduced) card.classList.add('stagger-init'); });
    const staggerObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = cards.indexOf(entry.target);
          setTimeout(() => {
            entry.target.classList.add('stagger-in');
            entry.target.classList.add('float-active');
          }, idx * 100);
          staggerObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    cards.forEach((card) => staggerObserver.observe(card));

    // 3D tilt-on-hover (desktop only)
    if (!prefersReduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      cards.forEach((card) => {
        const shine = document.createElement('div');
        shine.className = 'proj-tilt-shine';
        card.appendChild(shine);

        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width;
          const py = (e.clientY - rect.top) / rect.height;
          const tiltX = (py - 0.5) * -10;
          const tiltY = (px - 0.5) * 10;
          card.style.transform = `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-4px) scale(1.015)`;
          shine.style.setProperty('--mx', (px * 100) + '%');
          shine.style.setProperty('--my', (py * 100) + '%');
        });
        card.addEventListener('mouseleave', () => { card.style.transform = ''; });
      });
    }
  }

  function escapeHTML(str) {
    return String(str || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
  function escapeAttr(str) { return escapeHTML(str); }
})();
