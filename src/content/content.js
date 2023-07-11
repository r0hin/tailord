const a = document.createElement("div")
a.innerHTML = `TailorD: active page: ${window.location.href}. `
a.id = "tailord-root-element"
document.body.appendChild(a)

const b = document.createElement("style")
b.innerHTML = `
  #tailord-root-element {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 99999;
    width: 100%;
    height: 30px;
    background-color: #000;
    color: #fff;
  }

  body {
    margin-top: 30px;
  }
`
document.body.appendChild(b)