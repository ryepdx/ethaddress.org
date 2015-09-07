# element-icon-identicon

A single-purpose custom HTML element to display an [identicon](http://en.wikipedia.org/wiki/Identicon). For example:

```html
<icon-identicon code="abcd" size="200"></icon-identicon>
```

I've borrowed the MIT-licensed algorithm from @donpark's [identicon project]( https://github.com/donpark/identicon).

## Custom Element Framework Compatibility

- [x] [Polymer](http://www.polymer-project.org/)
- [ ] [X-Tags](http://www.x-tags.org/)
- [x] [Angular.JS](https://angularjs.org/)
- [ ] [React](http://facebook.github.io/react/)
- [ ] [Ember](http://emberjs.com/)

## Browser Compatibility

- requires HTML5 Canvas (_might_ work with a poly-fill)
- rendering is automatically crisp on high-density displays
