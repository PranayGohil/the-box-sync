/* Keep registration within reach once the main offer leaves the viewport. */
(() => {
    const hero = document.querySelector('.rm-hero');
    const finalOffer = document.querySelector('.rm-final-trial');
    const dock = document.querySelector('.rm-trial-dock');
    if (!hero || !finalOffer || !dock || !('IntersectionObserver' in window)) return;
    let pastHero = false;
    let finalVisible = false;
    const update = () => dock.classList.toggle('is-visible', pastHero && !finalVisible);
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.target === hero) pastHero = !entry.isIntersecting && entry.boundingClientRect.bottom <= 0;
            if (entry.target === finalOffer) finalVisible = entry.isIntersecting;
        });
        update();
    });
    observer.observe(hero);
    observer.observe(finalOffer);
})();
