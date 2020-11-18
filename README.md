less-plugin-theme-easy
=======================

write theme style more easy!

## lessc usage

```
npm install -g less-plugin-theme-easy
```

and then on the command line,

```
lessc file.less --theme-easy
```

Try the following code
```less
// TODO
@color-font-regular: {
  white: #5D6588;
  black: #CBD7F0;
}

@color-panel-item-active: {
  white: #464e64;
  black: #ffffff;
}

.item {
  color: theme(@color-font-regular);
  background: theme(@color-panel-item-active);
  border-color: theme(@color-panel-item-active);

  * {
    font-size: 12px;
    line-height: 30px;
  }

  &:hover, &.active {
    //color: theme(@color-panel-item-active);
    background-color: theme({
      //color: theme(@color-panel-item
      white: #eef4ff;
      /*background-color: theme({
      white: #eef4ff;*/
      black: #19233C;
    });
    color: theme(@color-font-regular);
    /*background-color: theme({
      white: #eef4ff;
      black: #19233C;
    });*/
  }

  .favorite-icon {
    margin-right: 5px;

    &.star {
      color: theme({
        white: #7E9EFD;
        black: #5073FF;
      });
    }
  }
}
```
It will be compiled to

```css
.white .item {
    color: #5D6588;
    background: #464e64;
    border-color: #464e64;
}
.black .item {
    color: #CBD7F0;
    background: #ffffff;
    border-color: #ffffff;
}
.item * {
    font-size: 12px;
    line-height: 30px;
}
.item:hover,
.item.active {
    /*background-color: theme({
        white: #eef4ff;
        black: #19233C;
      });*/
}
.white .item:hover,
.white .item.active {
    background-color: #eef4ff;
    color: #5D6588;
}
.black .item:hover,
.black .item.active {
    background-color: #19233C;
    color: #CBD7F0;
}
.item .favorite-icon {
    margin-right: 5px;
}
.white .item .favorite-icon.star {
    color: #7E9EFD;
}
.black .item .favorite-icon.star {
    color: #5073FF;
}
```
Then, you can control the global style by adding the desired attributes to your topmost element.
```vue
<!--Global Settings style-->
<body class="white">
  <div>...</div>
  <div class="item">
      <a class="favorite-icon">
        ...      
      </a>
  </div>
</body>
```
## options
If you use the plug-in constructor alone, allow the following parameters to be passed in:

| option                    | Description                                                  | Type                                              | Required | Default                |
| ------------------------- | ------------------------------------------------------------ | ------------------------------------------------- | -------- | ---------------------- |
| themeIdentityKeyWord      | The function name keyword to find in the value of the attribute to be replaced. | string                                            | false    | 'theme'                |
| themePropertyValueHandler | How to replace the attribute                                 | function(option:{key:string;value:string}):string | false    | Refer to the following |
| mergeSelector             | Whether to combine CSS chunks of the same selector(new option,it is added in 2.0.5+ ) | Boolean                                           | false    | true                   |

Default value of themePropertyValueHandler:

```js
  function replace({key, value}) {
    return `each(${value}, {
							@class: replace(@key, '@', '');
								.@{class} & {
									${key}: @value;
								}
						});`
  }
```
If mergeSelector = false, the output will be like this, and the same selector css rules will not be merged.

```css
.white .item {
    color: #5D6588;
}

.black .item {
    color: #CBD7F0;
}

.white .item {
    background: #464e64;
}

.black .item {
    background: #ffffff;
}

.white .item {
    border-color: #464e64;
}

.black .item {
    border-color: #ffffff;
}

.item * {
    font-size: 12px;
    line-height: 30px;
}

.item:hover,
.item.active {
    /*background-color: theme({
        white: #eef4ff;
        black: #19233C;
      });*/
}

.white .item:hover,
.white .item.active {
    background-color: #eef4ff;
}

.black .item:hover,
.black .item.active {
    background-color: #19233C;
}

.white .item:hover,
.white .item.active {
    color: #5D6588;
}

.black .item:hover,
.black .item.active {
    color: #CBD7F0;
}

.item .favorite-icon {
    margin-right: 5px;
}

.white .item .favorite-icon.star {
    color: #7E9EFD;
}

.black .item .favorite-icon.star {
    color: #5073FF;
}
```

For example

```js
import LessPluginTheme from 'less-plugin-theme'

new LessPluginTheme({
    themeIdentityKeyWord: 'a',
    themePropertyValueHandler: ({key,value})=>{return ...},
    mergeSelector: true
})
```
## Vue-cli config

If you use it in vue-cli, just add it in the vue.config.js file

```js
const LessThemePlugin = require('less-plugin-theme-easy')

module.exports = {
  // ...
  css: {
    loaderOptions: {
      less: {
        plugins: [
          new LessThemePlugin(/** ...options */),
        ],
      }
    }
  }
}
```
