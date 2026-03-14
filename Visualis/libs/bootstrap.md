# Bootstrap (bootstrap.css + bootstrap.js)

## Placeholder tag and where to put it
- Placeholder tag: `<Library:Bootstrap />`
- Put it inside `<head>`.
- This placeholder injects both CSS and JavaScript assets for Bootstrap.

## What this library does
- Bootstrap combines responsive CSS utility/component systems with optional JavaScript widgets.
- The CSS layer is class-driven; JS layer provides behavior for modal/dropdown/tab/etc.
- Use Bootstrap when you need predictable, consistent UI primitives quickly offline.

## How it works internally (mental model)
- Parsing/initialization stage creates runtime objects, caches config, and wires events/state updates.
- Runtime operations mutate internal state models and trigger render/update pipelines.
- Performance-sensitive paths often include batching/diffing/caching, so prefer incremental updates over full recreation.
- Offline usage means all behavior comes from local dist files only; no CDN assumptions.

## Exported functionality
- CSS utility/component classes
- window.bootstrap JS namespace

## Cheat sheet
| Task | Signature/Pattern | What it does |
|---|---|---|
| Grid | `.container .row .col-md-6` | Responsive layout |
| Spacing | `.mt-3 .px-2` | Margin/padding utilities |
| Modal JS | `bootstrap.Modal.getOrCreateInstance(el)` | Programmatic modal control |
| Tooltip | `new bootstrap.Tooltip(el, opts)` | Hover/focus hints |
| Collapse | `new bootstrap.Collapse(el)` | Accordion-like sections |

## Components and examples

### Layout & grid
- **Container / Row / Col**
  - **What it does:** Defines responsive page layout.
  - **Example:**
  ```html
  <div class="container">
    <div class="row">
      <div class="col-md-8">Main</div>
      <div class="col-md-4">Sidebar</div>
    </div>
  </div>
  ```

### Typography & content
- **Typography helpers**
  - **What it does:** Headings, lead text, small text.
  - **Example:**
  ```html
  <h1 class="h3">Page title</h1>
  <p class="lead mb-1">Lead paragraph.</p>
  <p class="small text-muted mb-0">Helper text</p>
  ```

- **Images**
  - **What it does:** Responsive images with optional rounded/circle.
  - **Example:**
  ```html
  <img src="avatar.jpg" class="img-fluid rounded-circle" alt="Avatar">
  ```

### Forms
- **Form controls**
  - **What it does:** Text inputs, selects, textareas with labels and validation.
  - **Example:**
  ```html
  <form>
    <div class="mb-3">
      <label for="email" class="form-label">Email</label>
      <input id="email" type="email" class="form-control" required>
      <div class="form-text">We'll never share your email.</div>
    </div>
  </form>
  ```

- **Input groups**
  - **What it does:** Combine inputs and add-ons.
  - **Example:**
  ```html
  <div class="input-group mb-3">
    <span class="input-group-text">@</span>
    <input type="text" class="form-control" placeholder="username">
  </div>
  ```

- **Checks & radios**
  - **What it does:** Custom styled checkboxes and radio buttons.
  - **Example:**
  ```html
  <div class="form-check">
    <input id="remember" class="form-check-input" type="checkbox">
    <label class="form-check-label" for="remember">Remember me</label>
  </div>
  ```

### Buttons & button groups
- **Buttons**
  - **What it does:** Primary/secondary actions with variants and sizes.
  - **Example:**
  ```html
  <button class="btn btn-primary btn-sm">Save</button>
  <button class="btn btn-outline-secondary">Cancel</button>
  ```

- **Button groups**
  - **What it does:** Group related actions horizontally or vertically.
  - **Example:**
  ```html
  <div class="btn-group" role="group">
    <button class="btn btn-outline-primary">Left</button>
    <button class="btn btn-outline-primary">Middle</button>
    <button class="btn btn-outline-primary">Right</button>
  </div>
  ```

### Navigation
- **Navs (basic)**
  - **What it does:** Horizontal/vertical navigation links.
  - **Example:**
  ```html
  <ul class="nav">
    <li class="nav-item">
      <a class="nav-link active" href="#">Active</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="#">Link</a>
    </li>
  </ul>
  ```

- **Tabs**
  - **What it does:** Tabbed navigation between content panes.
  - **Example:**
  ```html
  <ul class="nav nav-tabs" id="profileTabs" role="tablist">
    <li class="nav-item" role="presentation">
      <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#overview" type="button">
        Overview
      </button>
    </li>
    <li class="nav-item" role="presentation">
      <button class="nav-link" data-bs-toggle="tab" data-bs-target="#details" type="button">
        Details
      </button>
    </li>
  </ul>
  <div class="tab-content border border-top-0 p-3">
    <div id="overview" class="tab-pane fade show active">Overview content</div>
    <div id="details" class="tab-pane fade">Details content</div>
  </div>
  ```

- **Navbar**
  - **What it does:** Responsive site header with branding and navigation.
  - **Example:**
  ```html
  <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <div class="container-fluid">
      <a class="navbar-brand" href="#">Brand</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="mainNav">
        <ul class="navbar-nav me-auto">
          <li class="nav-item"><a class="nav-link active" href="#">Home</a></li>
        </ul>
      </div>
    </div>
  </nav>
  ```

### Feedback & status
- **Alerts**
  - **What it does:** Dismissible contextual messages.
  - **Example:**
  ```html
  <div class="alert alert-success alert-dismissible fade show" role="alert">
    Profile updated successfully.
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  </div>
  ```

- **Badges**
  - **What it does:** Small count/label indicators.
  - **Example:**
  ```html
  <button class="btn btn-primary">
    Inbox <span class="badge bg-light text-dark">4</span>
  </button>
  ```

- **Progress**
  - **What it does:** Visualizes completion percentage.
  - **Example:**
  ```html
  <div class="progress" style="height: 6px;">
    <div class="progress-bar bg-success" style="width: 40%;"></div>
  </div>
  ```

- **Spinners**
  - **What it does:** Loading indicators.
  - **Example:**
  ```html
  <div class="spinner-border text-primary" role="status" aria-label="Loading"></div>
  ```

### Cards & lists
- **Cards**
  - **What it does:** Flexible content containers with header/body/footer.
  - **Example:**
  ```html
  <div class="card">
    <div class="card-header">Profile</div>
    <div class="card-body">
      <h5 class="card-title mb-1">Jane Doe</h5>
      <p class="card-text mb-2">Product manager</p>
      <a href="#" class="btn btn-sm btn-primary">View</a>
    </div>
  </div>
  ```

- **List group**
  - **What it does:** Lists of items with active/disabled states.
  - **Example:**
  ```html
  <ul class="list-group">
    <li class="list-group-item active">First item</li>
    <li class="list-group-item">Second item</li>
  </ul>
  ```

### Overlays & popups
- **Modal**
  - **What it does:** Dialog overlay for confirmations/forms.
  - **Example:**
  ```html
  <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#confirmModal">
    Open modal
  </button>

  <div class="modal fade" id="confirmModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Confirm</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">Are you sure?</div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button class="btn btn-primary">Continue</button>
        </div>
      </div>
    </div>
  </div>
  ```

- **Tooltip**
  - **What it does:** Text hint on hover/focus.
  - **Example (HTML + JS):**
  ```html
  <button id="infoBtn" class="btn btn-link" data-bs-toggle="tooltip" title="More information">
    ?
  </button>
  <script>
    const infoBtn = document.getElementById('infoBtn');
    if (infoBtn) {
      new bootstrap.Tooltip(infoBtn);
    }
  </script>
  ```

- **Popover**
  - **What it does:** Rich, dismissible overlay with title and content.
  - **Example (HTML + JS):**
  ```html
  <button id="helpBtn" class="btn btn-outline-secondary"
          data-bs-toggle="popover"
          title="Help"
          data-bs-content="Short inline help.">
    Help
  </button>
  <script>
    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) {
      new bootstrap.Popover(helpBtn);
    }
  </script>
  ```

- **Dropdown**
  - **What it does:** Toggleable menu attached to a trigger.
  - **Example:**
  ```html
  <div class="dropdown">
    <button class="btn btn-secondary dropdown-toggle" data-bs-toggle="dropdown">
      Actions
    </button>
    <ul class="dropdown-menu">
      <li><a class="dropdown-item" href="#">Edit</a></li>
      <li><a class="dropdown-item" href="#">Delete</a></li>
    </ul>
  </div>
  ```

- **Offcanvas**
  - **What it does:** Sidebar-style panel that slides in.
  - **Example:**
  ```html
  <button class="btn btn-primary" data-bs-toggle="offcanvas" data-bs-target="#menuPanel">
    Open menu
  </button>

  <div class="offcanvas offcanvas-start" tabindex="-1" id="menuPanel">
    <div class="offcanvas-header">
      <h5 class="offcanvas-title">Menu</h5>
      <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
    </div>
    <div class="offcanvas-body">
      <a href="#" class="d-block mb-2">Dashboard</a>
      <a href="#" class="d-block">Settings</a>
    </div>
  </div>
  ```

### Carousels & toasts
- **Carousel**
  - **What it does:** Slideshow cycling through items.
  - **Example:**
  ```html
  <div id="heroCarousel" class="carousel slide" data-bs-ride="carousel">
    <div class="carousel-inner">
      <div class="carousel-item active">
        <img src="slide1.jpg" class="d-block w-100" alt="Slide 1">
      </div>
      <div class="carousel-item">
        <img src="slide2.jpg" class="d-block w-100" alt="Slide 2">
      </div>
    </div>
    <button class="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
      <span class="carousel-control-prev-icon" aria-hidden="true"></span>
      <span class="visually-hidden">Previous</span>
    </button>
    <button class="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
      <span class="carousel-control-next-icon" aria-hidden="true"></span>
      <span class="visually-hidden">Next</span>
    </button>
  </div>
  ```

- **Toast**
  - **What it does:** Lightweight, dismissible notification.
  - **Example (HTML + JS):**
  ```html
  <button id="showToastBtn" class="btn btn-primary">Show toast</button>

  <div id="statusToast" class="toast align-items-center text-bg-primary border-0" role="alert">
    <div class="d-flex">
      <div class="toast-body">Settings saved.</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto"
              data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  </div>

  <script>
    const toastEl = document.getElementById('statusToast');
    const toastBtn = document.getElementById('showToastBtn');
    if (toastEl && toastBtn) {
      const toast = new bootstrap.Toast(toastEl);
      toastBtn.addEventListener('click', () => toast.show());
    }
  </script>
  ```

## Comprehensive options and additional API references
- **Signature:** `new bootstrap.Modal(element, options?)`
  - **What it does:** Creates modal instance; options include backdrop, keyboard, focus.
  - **Example:**
```js
const modal = new bootstrap.Modal(el, { backdrop:'static' })
```
- **Signature:** `bootstrap.Modal.getOrCreateInstance(element)`
  - **What it does:** Returns existing modal instance or creates one.
  - **Example:**
```js
bootstrap.Modal.getOrCreateInstance(el).show()
```
- **Signature:** `new bootstrap.Tooltip(element, options?)`
  - **What it does:** Creates tooltip; options include placement, trigger, title, html, delay.
  - **Example:**
```js
new bootstrap.Tooltip(btn, { placement:'right', title:'Info' })
```
- **Signature:** `new bootstrap.Dropdown(element, options?)`
  - **What it does:** Creates dropdown; options include autoClose, reference, offset.
  - **Example:**
```js
new bootstrap.Dropdown(menuBtn, { autoClose:'outside' })
```
- **Signature:** `new bootstrap.Collapse(element, options?)`
  - **What it does:** Controls collapsible regions; option toggle decides immediate state change.
  - **Example:**
```js
new bootstrap.Collapse(panel, { toggle:false }).show()
```
- **Signature:** `Component events: show.bs.*, shown.bs.*, hide.bs.*, hidden.bs.*`
  - **What it does:** Lifecycle hooks for integrating custom logic.
  - **Example:**
```js
el.addEventListener('shown.bs.modal', () => input.focus())
```

## Advanced usage guidance for offline models
- Prefer deterministic, explicit configs over implicit defaults when generating code.
- Validate version-specific APIs before synthesis (especially AngularJS/Vue/vis ecosystem variants).
- When uncertain, emit conservative patterns first, then provide optional advanced alternatives.
- For large data, recommend incremental update APIs and cleanup/dispose methods to avoid leaks.

## Common pitfalls
- Using APIs from a different major version than the local dist file.
- Recreating instances repeatedly instead of updating existing instances.
- Omitting cleanup (`destroy`, unsubscribe, dispose) in dynamic UIs.
- Assuming remote plugins/assets exist in offline contexts.

## LLM quick synthesis prompt
- You are coding against local offline dist files. Use only APIs documented in this file.
- Always include concrete signatures and prefer minimal, working examples.
- If multiple approaches exist, provide the safest default then one advanced option.

