<template>
  <div style="padding: 2em 2em 2em 2em">
    <h1>
      Sorry, SciMap do not ready for mobile yet, please reopen it on you
      laptop/desktop
    </h1>

    You can
    <ul>
      <li>
        still <a :href="url">try desktop version on mobile</a> without any
        warranties
      </li>
      <li>or watch video about SciMap</li>
    </ul>
    <div style="text-align: center;">
      <iframe
        src="https://www.youtube.com/embed/DuiTlnrK6G4?si=HuVA4cs5U86H9E3l"
        title="YouTube video player"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen
      ></iframe>
    </div>
  </div>
</template>
<script lang="ts">
export default {
  setup() {
    const urlParams = new URLSearchParams(window.location.search);

    const from = new URL(decodeURI(urlParams.get("from")!));
    from.searchParams.append("forceDesktopOnMobile", "true");

    return {
      url: from.href
    };
  }
};
</script>
