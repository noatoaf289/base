# AngularJS (angular.js)

## Placeholder tag and where to put it
- Placeholder tag: `<Library:Angular />`
- Put it inside `<head>`.
- This placeholder injects this library's JavaScript assets.

## What this library does
- AngularJS (1.x) is an MVC/MVVM framework using two-way binding, dependency injection, and directive-driven templates.
- The runtime uses digest cycles to propagate model changes into views.
- It is legacy but still appears in enterprise offline/long-lived internal apps.

## How it works internally (mental model)
- Parsing/initialization stage creates runtime objects, caches config, and wires events/state updates.
- Runtime operations mutate internal state models and trigger render/update pipelines.
- Performance-sensitive paths often include batching/diffing/caching, so prefer incremental updates over full recreation.
- Offline usage means all behavior comes from local dist files only; no CDN assumptions.

## Exported functionality
- window.angular
- module system
- DI container
- templating directives

## Cheat sheet
| Task | Signature/Pattern | What it does |
|---|---|---|
| Create module | `angular.module('app', [])` | Defines root module |
| Register controller | `.controller('C', fn)` | Attaches presentation logic |
| HTTP client | `$http.get('/api')` | AJAX with digest integration |
| Custom directive | `.directive('x', ddoFactory)` | Build reusable template behavior |
| Watch model | `$scope.$watch('a', cb)` | React to value changes |

## Comprehensive options and additional API references
- **Signature:** `angular.module(name: string, deps?: string[])`
  - **What it does:** Creates or fetches a module.
  - **Example:**
```js
const app = angular.module('demo', [])
```
- **Signature:** `module.controller(name: string, ctor: Function)`
  - **What it does:** Registers controller constructor function.
  - **Example:**
```js
app.controller('MainCtrl', function($http){ /* ... */ })
```
- **Signature:** `module.service(name: string, ctor: Function)`
  - **What it does:** Registers singleton class-like service.
  - **Example:**
```js
app.service('Api', function($http){ this.list=()=>$http.get('/api') })
```
- **Signature:** `$http(config | method helpers)`
  - **What it does:** Performs HTTP requests with rich request options.
  - **Example:**
```js
$http({ method:'POST', url:'/x', data:{a:1}, timeout:3000 })
```
- **Signature:** `directive DDO: { restrict, scope, template, link, require, transclude, ... }`
  - **What it does:** Defines directive behavior and integration contract.
  - **Example:**
```js
app.directive('badge', () => ({ restrict:'E', scope:{text:'@'}, template:'<span>{{text}}</span>' }))
```
- **Signature:** `$scope.$watch(expr, listener, objectEquality?)`
  - **What it does:** Runs listener when watched expression changes.
  - **Example:**
```js
$scope.$watch('vm.query', (q) => vm.search(q))
```
- **Signature:** `$routeProvider.when(path, routeConfig)`
  - **What it does:** Declares route mapping (with ngRoute).
  - **Example:**
```js
$routeProvider.when('/users', { templateUrl:'users.html', controller:'UsersCtrl as vm' })
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

