/* ===========================================================================
   support.js — reconstructed
   ---------------------------------------------------------------------------
   The Warm Boutique handoff references ./support.js but the zip did not
   contain it, so the reference rendered raw {{ }} mustaches and could not be
   reviewed. This is a minimal reimplementation of the contract the exported
   file relies on:

     class DCLogic      — state + setState + renderVals() -> data, re-render
     {{ path }}         — interpolation, in text nodes AND in attributes
     <sc-for list as>   — repeat children per item, binding `as` in scope
     <sc-if value>      — keep children when truthy
     onClick="{{ fn }}" — bind a function from the returned data

   It exists only to make the supplied design file viewable. It is NOT part of
   the UCP build and nothing in the prototype depends on it.
   =========================================================================== */
(function () {
  const MUSTACHE = /\{\{\s*([^}]+?)\s*\}\}/g;

  const lookup = (path, scope) => {
    if (path === "true") return true;
    if (path === "false") return false;
    return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), scope);
  };

  const interpolate = (text, scope) =>
    text.replace(MUSTACHE, (_, p) => {
      const v = lookup(p, scope);
      return v == null ? "" : String(v);
    });

  /** A single {{ expr }} that fills the whole value resolves to the value
      itself, so a function can be bound rather than stringified. */
  function whole(value, scope) {
    const m = /^\{\{\s*([^}]+?)\s*\}\}$/.exec(value.trim());
    return m ? lookup(m[1], scope) : undefined;
  }

  function walk(node, scope) {
    const kids = [...node.childNodes];
    for (const child of kids) {
      if (child.nodeType === Node.TEXT_NODE) {
        if (child.nodeValue.includes("{{")) child.nodeValue = interpolate(child.nodeValue, scope);
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const tag = child.tagName.toLowerCase();

      if (tag === "sc-for") {
        const list = whole(child.getAttribute("list") || "", scope);
        const as = child.getAttribute("as") || "item";
        const frag = document.createDocumentFragment();
        for (const item of Array.isArray(list) ? list : []) {
          const inner = Object.create(scope);
          inner[as] = item;
          for (const tpl of [...child.children]) {
            const copy = tpl.cloneNode(true);
            walkSelf(copy, inner);
            frag.appendChild(copy);
          }
        }
        child.replaceWith(frag);
        continue;
      }

      if (tag === "sc-if") {
        const ok = whole(child.getAttribute("value") || "", scope);
        const frag = document.createDocumentFragment();
        if (ok) for (const tpl of [...child.children]) {
          const copy = tpl.cloneNode(true);
          walkSelf(copy, scope);
          frag.appendChild(copy);
        }
        child.replaceWith(frag);
        continue;
      }

      walkSelf(child, scope);
    }
  }

  function walkSelf(el, scope) {
    for (const attr of [...el.attributes]) {
      if (!attr.value.includes("{{")) continue;
      if (/^on/i.test(attr.name)) {
        const fn = whole(attr.value, scope);
        el.removeAttribute(attr.name);
        if (typeof fn === "function") el.addEventListener(attr.name.slice(2).toLowerCase(), fn);
        continue;
      }
      el.setAttribute(attr.name, interpolate(attr.value, scope));
    }
    walk(el, scope);
  }

  class DCLogic {
    constructor(root) {
      this.root = root;
      this.template = root.cloneNode(true);
      this.state = {};
    }
    setState(updater) {
      const next = typeof updater === "function" ? updater(this.state) : updater;
      this.state = { ...this.state, ...next };
      this.render();
    }
    render() {
      const fresh = this.template.cloneNode(true);
      walk(fresh, this.renderVals());
      this.root.replaceChildren(...fresh.childNodes);
    }
  }
  window.DCLogic = DCLogic;

  /* The component is carried in <script type="text/x-dc" data-dc-script>, which
     the browser will not execute — the loader is expected to read and evaluate
     it. That is why nothing rendered until this was added. */
  document.addEventListener("DOMContentLoaded", () => {
    const holder = document.querySelector("script[data-dc-script]");
    if (!holder) return;
    const factory = new Function("DCLogic", holder.textContent + "\nreturn Component;");
    const Component = factory(DCLogic);
    const root = document.body;
    const c = new Component(root);
    c.state = c.state || {};
    c.render();
  });
})();
