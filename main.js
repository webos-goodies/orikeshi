const NUM_COLS  = 13;
const NUM_ROWS  = 13;
const NUM_STOCK = 8;

const PALETTE_COLORS = [
  ['wh1', 'bk1', 'gy1', 'rd1', 'br1', 'br2', 'or1', 'or2'],
  ['pk1', 'pk2', 'pu1', 'pu2', 'ye1', 'ye2', 'ye3', 'ye4'],
  ['gr1', 'gr2', 'gr3', 'gr4', 'bl1', 'bl2', 'bl3', 'bl4']
];

const COLOR_NAMES = {
  wh1: '白色（しろいろ）',
  bk1: '黒色（くろいろ）',
  gy1: '灰色（はいいろ）',
  rd1: '赤色（あかいろ）',
  bl1: '青色（あおいろ）',
  bl2: '空色（そらいろ）',
  bl3: 'アイスブルー',
  bl4: '水色（みずいろ）',
  gr1: '緑色（みどりいろ）',
  gr2: '黄緑色（きみどりいろ）',
  gr3: 'ミントグリーン',
  gr4: 'エメラルドグリーン',
  br1: '茶色（ちゃいろ）',
  br2: '薄茶色（うすちゃいろ）',
  pk1: 'ピンク色',
  pk2: 'さくら色',
  or1: 'オレンジ色',
  or2: '薄オレンジ色（うすオレンジいろ）',
  pu1: 'うす紫色（うすむらさきいろ）',
  pu2: 'ラベンダー',
  ye1: 'ひまわり色',
  ye2: '黄色（きいろ）',
  ye3: 'レモンイエロー',
  ye4: 'クリーム色',
};

function getBoundingRect(element) {
  let r = element.getBoundingClientRect();
  return { x: r.left + window.scrollX, width:  r.right  - r.left,
           y: r.top  + window.scrollY, height: r.bottom - r.top };
}

function buildGridElement(data, fn, opt_scope) {
  let tableEl = document.createElement('table');
  for(let y = 0 ; y < data.length ; y++) {
    let trEl = document.createElement('tr');
    let row  = data[y];
    for(let x = 0 ; x < row.length ; x++) {
      let tdEl = document.createElement('td');
      fn.call(opt_scope || null, tdEl, row[x], x, y);
      trEl.appendChild(tdEl);
    }
    tableEl.appendChild(trEl);
  }
  return tableEl;
}

(function() {
  // Prevent touch scrolling on iOS.
  document.ontouchmove = function(event) { event.preventDefault(); };

  // Prevent double tap zooming on iOS.
  let lastTouch = 0;
  document.addEventListener('touchend', event => {
    const now = window.performance.now();
    if (now - lastTouch <= 500) {
      event.preventDefault();
    }
    lastTouch = now;
  }, false);

  // Prevent pinch in/out on iOS.
  document.addEventListener('touchstart', event => {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  }, { passive:false });
})();

class App {

  constructor() {
    this.events_  = new EventManager();
    this.storage_ = new Storage(this.events_);
    this.editor_  = new Editor(document.querySelector('.editor'), this.events_);
    this.preview_ = new Preview(document.querySelector('.preview'), this.events_);
    this.palette_ = new Palette(document.querySelector('.palette'), this.events_);
    this.color_   = new ColorName(document.querySelector('.color'), this.events_);
    this.stocks_  = [];
    var stockEls  = document.querySelectorAll('.stock');
    for(let i = 0 ; i < stockEls.length ; i++) {
      this.stocks_.push(new Stock(stockEls[i], this.events_, i));
    }
    this.buttons_ = [];
    for(let el of document.querySelectorAll('.button')) {
      this.buttons_.push(new Button(el, this.events_));
    }
    this.layoutTimerId_ = null;
    this.layout();
    this.storage_.replay();
    window.addEventListener('resize', this.onResize.bind(this));
  }

  layout() {
    this.layoutTimerId_ = null;
    let viewWidth  = document.documentElement.clientWidth;
    let viewHeight = document.documentElement.clientHeight;
    if(viewWidth > viewHeight) {
      this.layoutHorizontal(viewWidth - 32, viewHeight - 32);
    } else {
      this.layoutVertical(viewWidth - 32, viewHeight - 32);
    }
    let appEl = document.querySelector('.app');
    appEl.style.left = ((viewWidth  - appEl.offsetWidth)  / 2 | 0) + 'px';
    appEl.style.top  = ((viewHeight - appEl.offsetHeight) / 2 | 0) + 'px';
    this.events_.dispatch('resize', {});
  }

  layoutHorizontal(viewWidth, viewHeight) {
    let scale = viewWidth > viewHeight * 1.5 ? viewHeight / 512 : viewWidth / 768;
    let s = function(v) { return (v * scale | 0) + 'px'; };
    let layout = [
      ['app',     `width:${s(768)}; height:${s(512)};`],
      ['editor',  `top:0; left:0; width:${s(512)}; height:${s(512)};`],
      ['preview', `top:0; left:${s(530)}; width:${s(128)}; height:${s(128)}`],
      ['scroll',  `top:${s(50)}; left:${s(678)}; width:${s(80)}; height:${s(80)}`],
      ['colors',  `top:${s(148)}; left:${s(530)}; width:${s(238)};`],
      ['palette', `height:${s(30 * PALETTE_COLORS.length)}`],
      ['color',   `margin:0.2em 0 0 0.5em; font-size:${s(10)};`],
      ['gallery', `bottom:0; left:${s(530)}; width:${s(238)}`],
      ['stocks',  `height:${s(116)}`],
      ['stock',   `width:${s(52)}; height:${s(52)};`],
      ['message', `font-size:${s(11)}; margin-bottom:0.2em;`]
    ];
    for(let [klass, style] of layout) {
      for(let el of document.querySelectorAll('.' + klass)) {
        el.style.cssText = style;
      }
    }
  }

  layoutVertical(viewWidth, viewHeight) {
    let scale = viewHeight > viewWidth * 1.5 ? viewWidth / 512 : viewHeight / 768;
    let s = function(v) { return (v * scale | 0) + 'px'; };
    let layout = [
      ['app',     `width:${s(512)}; height:${s(768)};`],
      ['editor',  `top:${s(148)}; left:0; width:${s(512)}; height:${s(512)};`],
      ['preview', `top:0; left:0; width:${s(128)}; height:${s(128)}`],
      ['scroll',  `top:${s(50)}; left:${s(410)}; width:${s(80)}; height:${s(80)}`],
      ['colors',  `top:$0; left:${s(150)}; width:${s(238)};`],
      ['palette', `height:${s(30 * PALETTE_COLORS.length)}`],
      ['color',   `margin:0.2em 0 0 0.5em; font-size:${s(10)};`],
      ['gallery', `bottom:0; left:0; width:100%`],
      ['stocks',  `height:auto`],
      ['stock',   `width:${s(52)}; height:${s(52)};`],
      ['message', `font-size:${s(11)}; margin-bottom:0.2em;`]
    ];
    for(let [klass, style] of layout) {
      for(let el of document.querySelectorAll('.' + klass)) {
        el.style.cssText = style;
      }
    }
  }

  onResize(ev) {
    if(this.layoutTimerId_ !== null) {
      clearTimeout(this.layoutTimerId_);
    }
    setTimeout(this.layout.bind(this), 100);
  }

}

class EventManager {

  constructor() {
    this.listeners = [];
  }

  listen(fn, opt_scope) {
    this.listeners.push([fn, opt_scope || null]);
  }

  dispatch(name, value) {
    for(let listener of this.listeners) {
      listener[0].call(listener[1], name, value);
    }
  }

}

class Storage {

  constructor(events) {
    this.events  = events;
    this.timerId = null;

    this.data = {
      color:  PALETTE_COLORS[0][1],
      canvas: this.generateGrid(PALETTE_COLORS[0][0]),
      stock:  []
    };
    for(let i = 0 ; i < NUM_STOCK ; i++) {
      this.data.stock[i] = this.generateGrid(PALETTE_COLORS[0][0]);
    }

    try {
      this.load();
    } catch(e) {
      console.log(e);
    }
  }

  generateGrid(color) {
    let grid = [];
    for(let y = 0 ; y < NUM_ROWS ; y++) {
      let row = [];
      for(let x = 0 ; x < NUM_COLS ; x++) {
        row.push(color);
      }
      grid.push(row);
    }
    return grid;
  }

  copyGrid(dst, src) {
    if(src instanceof Array) {
      for(let y = 0 ; y < NUM_ROWS ; y++) {
        for(let x = 0 ; x < NUM_COLS ; x++) {
          let value = (src[y] || [])[x];
          if(value) {
            dst[y][x] = value;
          }
        }
      }
    }
  }

  load() {
    var data = JSON.parse(localStorage.orikeshiData);
    if(data.color !== undefined) {
      this.data.color = data.color;
    }
    this.copyGrid(this.data.canvas, data.canvas);
    if(data.stock instanceof(Array)) {
      for(let i = 0 ; i < NUM_STOCK ; i++) {
        this.copyGrid(this.data.stock[i], data.stock[i]);
      }
    }
  }

  save() {
    localStorage.orikeshiData = JSON.stringify(this.data);
    this.timerId = null;
  }

  delaySave() {
    if(this.timerId !== null) {
      clearTimeout(this.timerId);
    }
    this.timerId = setTimeout(this.save.bind(this), 500);
  }

  replay() {
    this.events.dispatch('color', { color:this.data.color });
    this.updateCanvas();
    this.updateStock();
    this.events.listen(this.onEvent, this);
  }

  updateCanvas(dx=0, dy=0) {
    dx = ((dx % NUM_COLS) + NUM_COLS) % NUM_COLS;
    dy = ((dy % NUM_ROWS) + NUM_ROWS) % NUM_ROWS;
    let src = this.data.canvas.map((x) => x.slice(0));
    for(let y = 0 ; y < NUM_ROWS ; y++) {
      for(let x = 0 ; x < NUM_COLS ; x++) {
        let v = { x:(x + dx) % NUM_COLS, y:(y + dy) % NUM_ROWS, color:src[y][x] };
        this.events.dispatch('draw', v);
      }
    }
  }

  updateStock() {
    for(let i = 0 ; i < NUM_STOCK ; i++) {
      this.events.dispatch('stock', { index:i, grid:this.data.stock[i] });
    }
  }

  onEvent(name, value) {
    switch(name) {
    case 'draw':
      this.data.canvas[value.y][value.x] = value.color;
      this.delaySave();
      break;
    case 'color':
      this.data.color = value.color;
      this.delaySave();
      break;
    case 'swap':
      if(this.data.stock[value.index]) {
        let stock = this.data.stock[value.index];
        this.data.stock[value.index] = this.data.canvas;
        this.data.canvas = stock;
        this.updateCanvas();
        this.updateStock();
      }
      break;
    case 'scroll':
      this.updateCanvas(value.x, value.y);
      break;
    }
  }

}

class Component {

  constructor(rootEl, events) {
    this.rootEl = rootEl;
    this.events = events;
    this.events.listen(this.onEvent, this);
  }

  onEvent(name, value) {
  }

}

class Grid extends Component {

  constructor(rootEl, events) {
    super(rootEl, events);
    this.grid   = [];
    this.gridEl = null;

    let grid = [], color = PALETTE_COLORS[0][0];
    for(let y = 0 ; y < NUM_ROWS ; y++) {
      let row = [];
      for(let x = 0 ; x < NUM_COLS ; x++) {
        row.push(color);
      }
      grid.push(row);
    }

    this.gridEl = buildGridElement(grid, this.buildCell, this);
    this.rootEl.appendChild(this.gridEl);
  }

  buildCell(el, color, x, y) {
    el.className = 'c-' + color;
    (this.grid[y] = this.grid[y] || [])[x] = [el, color];
  }

  setCellColor(x, y, color) {
    let cell = this.grid[y][x];
    if(cell && cell[1] != color) {
      cell[1] = color;
      cell[0].className = 'c-' + color;
    }
  }

}

class Editor extends Grid {

  constructor(rootEl, events) {
    super(rootEl, events);
    this.touchs = {};
    this.color  = PALETTE_COLORS[0][1];

    this.gridEl.onpointerdown = this.onPointerDown.bind(this);
    this.gridEl.onpointerup   = this.onPointerUp.bind(this);
    this.gridEl.onpointermove = this.onPointerMove.bind(this);

    this.updatePosition();
  }

  updatePosition() {
    this.gridRect = getBoundingRect(this.gridEl);
  }

  onPointerDown(ev) {
    this.gridEl.setPointerCapture(ev.pointerId);
    this.touchs[ev.pointerId] = true;
    this.updateColor(ev.clientX, ev.clientY, this.color);
    ev.preventDefault();
  }

  onPointerUp(ev) {
    this.gridEl.releasePointerCapture(ev.pointerId);
    delete this.touchs[ev.pointerId];
    ev.preventDefault();
  }

  onPointerMove(ev) {
    if(this.touchs[ev.pointerId]) {
      this.updateColor(ev.clientX, ev.clientY, this.color);
    }
    ev.preventDefault();
  }

  updateColor(clientX, clientY, color) {
    let x = (clientX + window.scrollX - this.gridRect.x) * NUM_COLS / this.gridRect.width  | 0;
    let y = (clientY + window.scrollY - this.gridRect.y) * NUM_ROWS / this.gridRect.height | 0;
    let cell = this.grid[y][x];
    if(cell && cell[1] != color) {
      this.events.dispatch('draw', { x:x, y:y, color:color });
    }
  }

  onEvent(name, value) {
    switch(name) {
    case 'draw':   this.setCellColor(value.x, value.y, value.color); break;
    case 'color':  this.color = value.color; break;
    case 'resize': this.updatePosition(); break;
    }
  }

}

class Preview extends Grid {

  onEvent(name, value) {
    switch(name) {
    case 'draw': this.setCellColor(value.x, value.y, value.color); break;
    }
  }

}

class Stock extends Grid {

  constructor(rootEl, events, index) {
    super(rootEl, events);
    this.index = index;
    this.rootEl.addEventListener('click', this.onClick.bind(this), false);
  }

  onClick(ev) {
    this.events.dispatch('swap', { index:this.index });
  }

  onEvent(name, value) {
    switch(name) {
    case 'stock':
      if(value.index == this.index) {
        this.rootEl.removeChild(this.gridEl);
        this.gridEl = buildGridElement(value.grid, this.buildCell, this);
        this.rootEl.appendChild(this.gridEl);
      }
      break;
    }
  }

}

class Palette extends Component {

  constructor(rootEl, events) {
    super(rootEl, events);
    this.gridEl = buildGridElement(PALETTE_COLORS, this.buildCell, this);
    this.rootEl.appendChild(this.gridEl);
    this.gridEl.addEventListener('click', this.onClick.bind(this), false);
  }

  buildCell(el, color, x, y) {
    el.className     = 'c-' + color;
    el.dataset.color = color;
  }

  onClick(ev) {
    let color = ev.target.dataset.color;
    if(color) {
      this.events.dispatch('color', { color:color });
    }
  }

  onEvent(name, value) {
    switch(name) {
    case 'color':
      for(let el of this.gridEl.querySelectorAll('[data-color]')) {
        if(el.dataset.color == value.color) {
          el.classList.add('selected');
        } else {
          el.classList.remove('selected');
        }
      }
      break;
    }
  }

}

class ColorName extends Component {

  onEvent(name, value) {
    switch(name) {
    case 'color':
      this.rootEl.textContent = COLOR_NAMES[value.color] || '';
      break;
    }
  }

}

class Button {

  constructor(element, events) {
    this.events    = events;
    this.eventName = element.dataset.event;
    this.value     = JSON.parse(element.dataset.value.replace(/([a-zA-Z_]\w*):/g, '"$1":'));
    element.addEventListener('click', this.onClick.bind(this), false);
  }

  onClick(ev) {
    this.events.dispatch(this.eventName, this.value);
    ev.preventDefault();
  }

}

new App();
