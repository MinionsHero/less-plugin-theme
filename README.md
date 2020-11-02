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
@color: red;
@borderColor: {
  xl: #dddddd;
  xxl: #ffffff
};
.link {
  font-size: 12px;
  /**
     The following statement will be transfer
    .white .link,
    .white.link {
      color: #dddddd;
    }
    .black .link,
    .black.link {
      color: #ffffff;
    }
   */
  color: theme({
    white: #dddddd;
    black: #ffffff;
  });
  /**
     The following statement will be transfer
    .xl .link,
    .xl.link {
      border-color: #dddddd;
    }
    .xxl .link,
    .xxl.link {
      border-color: #ffffff;
    }
   */
  border-color: theme(@borderColor);
  background-color: theme({
    white: #dddddd;
    black: #123456;
  });
  a {
    .hello {
      &.h {
        .white &, .white& {
          color: @color;
        }
      }
    }
  }
}
```
It will be compiled to

```css
.link {
  font-size: 12px;
}
.white .link,
.white.link {
  color: #dddddd;
}
.black .link,
.black.link {
  color: #ffffff;
}
.xl .link,
.xl.link {
  border-color: #dddddd;
}
.xxl .link,
.xxl.link {
  border-color: #ffffff;
}
.white .link,
.white.link {
  background-color: #dddddd;
}
.black .link,
.black.link {
  background-color: #123456;
}
.white .link a .hello.h,
.white.link a .hello.h {
  color: red;
}
```
Then,you can control the global style by adding the desired attributes to your topmost element.
```vue
<!--Global Settings style-->
<body class="white xl">
  <div>...</div>
  <div class="link">
      <a>
        ...      
      </a>
  </div>
  <!--Set styles separately-->
  <div class="link black">
      <a>
        ...      
      </a>
  </div>
</body>
```

