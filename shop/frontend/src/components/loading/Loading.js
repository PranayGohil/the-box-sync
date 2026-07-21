import React, { useEffect } from 'react';

const Loading = () => {
  useEffect(() => {
    const contentArea = document.querySelector('#contentArea');
    const htmlTag = document.documentElement;
    let loader = document.querySelector('#page-loader');

    // Dynamic fallback: If loader element is missing, construct it programmatically
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'page-loader';
      loader.className = 'page-loader';
      loader.innerHTML = `
        <div class="loader-inner">
          <div class="logo-container">
            <img src="/img/logo/loader-logo.png" class="loader-logo-img" alt="Logo" />
            <img src="/img/logo/loader-shadow.png" class="loader-shadow-img" alt="Shadow" />
          </div>
          <div class="text-container">
            <img src="/img/logo/loader-text.png" class="loader-text-img" alt="The Box" />
          </div>
        </div>
      `;
      document.body.appendChild(loader);
    }

    // Reset loader to active/bouncing state
    loader.classList.remove('loaded', 'hidden');

    if (!contentArea) {
      htmlTag.setAttribute('data-show', 'false');
    } else {
      contentArea.style = 'opacity:0';
    }
    document.body.classList.add('spinner');

    let timeoutId;
    return () => {
      // Step 1: Trigger the text transition (Logo to Text morph)
      loader.classList.add('loaded');

      // Step 2: Let the text display, then fade out the loader overlay completely
      timeoutId = setTimeout(() => {
        if (!contentArea) {
          htmlTag.setAttribute('data-show', 'true');
        } else {
          contentArea.style = 'opacity:1';
        }
        document.body.classList.remove('spinner');
        loader.classList.add('hidden');
      }, 1000); // 1.0 second duration for the transition and display
    };
  }, []);

  return <></>;
};

export default Loading;
