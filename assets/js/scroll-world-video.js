/* Scroll-scrubbed background video, adapted from https://github.com/oso95/scroll-world (MIT). */
(function () {
  var video = document.querySelector('[data-scroll-world-video]');
  var background = video && video.closest('.scroll-world-bg');
  var webm = video && video.dataset.webm;
  var mp4 = video && video.dataset.mp4;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!video || !background || !webm || !mp4) return;

  // Times are seconds at the section's top and bottom; use equal values to hold a frame.
  // Use 'end' to map to the video's final frame.
  var sectionTimings = [
    { id: 'sobre_mi', start: 1.8, end: 3.8 },
    { id: 'servicios', start: 3.8, end: 4 },
    { id: 'rendimiento', start: 4, end: 5.6 },
    { id: 'faq', start: 5.6, end: 'end' },
  ];

  var webmSupport = video.canPlayType('video/webm; codecs="vp9"');
  var source = webmSupport ? webm : mp4;
  var usingWebm = !!webmSupport;

  var ready = false;
  var target = 0;
  var sections = [];

  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';

  function topOf(element) {
    return element.getBoundingClientRect().top + window.scrollY;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function seekToTarget() {
    if (!ready || reduce || video.seeking) return;
    var time = clamp(target, 0, video.duration * 0.999);
    if (Math.abs(video.currentTime - time) < 0.03) return;
    try {
      video.currentTime = time;
    } catch (error) {
      console.warn('scroll-world: could not seek the background video.', error);
    }
  }

  function resolveTime(value) {
    if (value === 'end') return video.duration;
    var time = Number(value);
    if (!Number.isFinite(time)) {
      console.error('scroll-world: invalid video time in section timing configuration.', value);
      return 0;
    }
    return clamp(time, 0, video.duration * 0.999);
  }

  function updateTarget() {
    if (!ready || sections.length === 0) return;

    var y = window.scrollY;
    var first = sections[0];
    if (y < first.top) {
      target = first.start * clamp(y / Math.max(first.top, 1), 0, 1);
    } else {
      target = first.start;
      for (var i = 0; i < sections.length; i++) {
        var section = sections[i];
        if (y < section.top) break;
        if (y <= section.bottom) {
          var progress = clamp((y - section.top) / Math.max(section.bottom - section.top, 1), 0, 1);
          target = section.start + (section.end - section.start) * progress;
          break;
        }
        target = section.end;
        if (i + 1 < sections.length && y < sections[i + 1].top) break;
      }
    }
    target = clamp(target, 0, video.duration * 0.999);
    seekToTarget();
  }

  function updateLayout() {
    if (!ready) return;
    sections = sectionTimings
      .map(function (timing) {
        var element = document.getElementById(timing.id);
        if (!element) {
          console.error('scroll-world: section #' + timing.id + ' was not found.');
          return null;
        }
        var top = topOf(element);
        return {
          top: top,
          bottom: top + element.offsetHeight,
          start: resolveTime(timing.start),
          end: resolveTime(timing.end),
        };
      })
      .filter(Boolean);
    updateTarget();
  }

  video.addEventListener('loadedmetadata', function () {
    if (!Number.isFinite(video.duration) || video.duration <= 0) {
      console.error('scroll-world: the background video has no valid duration.');
      return;
    }
    ready = true;
    updateLayout();
  });
  video.addEventListener('seeked', seekToTarget);

  video.addEventListener('loadeddata', function () {
    background.classList.add('is-ready');
    updateTarget();
  });

  video.addEventListener('error', function () {
    if (usingWebm) {
      usingWebm = false;
      source = mp4;
      video.src = source;
      video.load();
      return;
    }
    console.error('scroll-world: the background video could not be decoded.', video.error);
  });

  window.addEventListener('scroll', updateTarget, { passive: true });
  window.addEventListener('scroll-world-update', updateTarget);
  window.addEventListener('resize', updateLayout);
  window.addEventListener('load', updateLayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(updateLayout);

  video.src = source;
  video.load();
  updateLayout();
})();
