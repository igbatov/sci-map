const codes = {
    leftSquareBracket: 0x5b,
    rightSquareBracket: 0x5d,
    leftCurlyBrace: 0x7b,
    rightCurlyBrace: 0x7d,
    cr: 0x0d,
    lf: 0x0a
  }
  
  export function tooltip(md: any, settings: any) {
    const defaults = {
      renderTooltip
    }
  
    settings = md.utils.assign({}, defaults, settings || {})
  
    md.renderer.rules.tooltip = render
  
    md.inline.ruler.after('image', 'tooltip', tooltipCall)
  
    // Syntax: [tooltip-text]{tooltip-note}
    function tooltipCall(state: any, silent: any) {
      const start = state.pos
      const max = state.posMax
      let pos
  
      if (state.src.charCodeAt(start) !== codes.leftSquareBracket) return false // Must start with '['
  
      // check syntax: [.*]{.*}
      for (pos = start + 1; pos < max; pos++) {
        if (
          state.src.charCodeAt(pos) === codes.cr ||
          state.src.charCodeAt(pos) === codes.lf ||
          state.src.charCodeAt(pos) === codes.leftSquareBracket
        ) {
          return false
        }
  
        if (state.src.charCodeAt(pos) === codes.rightSquareBracket) {
          break
        }
      }
  
      if (pos <= start + 2) return false // No empty tooltip-text
  
      const textStart = start + 1
      const textEnd = pos
      const tooltipText = state.src.slice(textStart, textEnd)
  
      if (state.src.charCodeAt(++pos) !== codes.leftCurlyBrace) return false
  
      const noteStart = pos + 1
  
      for (pos = noteStart; pos < max; pos++) {
        if (
          state.src.charCodeAt(pos) === codes.cr ||
          state.src.charCodeAt(pos) === codes.lf ||
          state.src.charCodeAt(pos) === codes.leftCurlyBrace
        ) {
          return false
        }
  
        if (state.src.charCodeAt(pos) === codes.rightCurlyBrace) {
          break
        }
      }
  
      if (pos <= noteStart + 1) return false // No empty tooltip-note
  
      const noteEnd = pos
      const tooltipNote = state.src.slice(noteStart, noteEnd)
  
      if (!silent) {
        const token = state.push('tooltip', '', 0)
        token.meta = {tooltipText, tooltipNote}
      }
  
      state.pos = pos + 1
      return true
    }
  
    function render(tokens: any, idx: any) {
      const tooltipText = tokens[idx].meta.tooltipText
      const tooltipNote = tokens[idx].meta.tooltipNote
      return settings.renderTooltip(tooltipText, tooltipNote)
    }
  
    function renderTooltip(tooltipText: any, tooltipNote: any) {
      return (
        '<span class="tooltip"><span class="summary">' +
        tooltipText +
        '</span><span class="detail">' +
        tooltipNote +
        '</span></span>'
      )
    }
  }
  