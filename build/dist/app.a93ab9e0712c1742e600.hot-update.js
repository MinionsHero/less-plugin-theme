webpackHotUpdate("app",{

/***/ "./build/test.ts":
/*!***********************!*\
  !*** ./build/test.ts ***!
  \***********************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _parser__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @/parser */ "./src/parser.ts");
/* harmony import */ var _test_input_less__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @test/input.less */ "./test/input.less");


const parser = new _parser__WEBPACK_IMPORTED_MODULE_0__["default"]();
let result = parser.process(_test_input_less__WEBPACK_IMPORTED_MODULE_1__["default"], { context: '', fileInfo: '', imports: [] });
console.log(result);


/***/ }),

/***/ "./src/parser.ts":
/*!***********************!*\
  !*** ./src/parser.ts ***!
  \***********************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return Parser; });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @/utils */ "./src/utils.ts");
/* harmony import */ var _CommentHandler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/CommentHandler */ "./src/CommentHandler.ts");
/* harmony import */ var _ThemePropertyHandler__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/ThemePropertyHandler */ "./src/ThemePropertyHandler.ts");



class Parser {
    constructor(options) {
        this.input = '';
        this.themeIdentityKeyWord = options && options.themeIdentityKeyWord || 'theme';
        this.themePropertyValueHandler = options && options.themePropertyValueHandler ||
            function ({ key, value }) {
                return `each(${value}, {
                            @class: replace(@key, '@', '');
                                .@{class} & {
                                    ${key}: @value;
                                }
                            });`;
            };
        this.throwLessError = (index, message) => {
            throw new Error(message);
        };
    }
    process(input, { context, imports, fileInfo }) {
        this.throwLessError = Object(_utils__WEBPACK_IMPORTED_MODULE_0__["default"])(fileInfo, input).throwLessError;
        this.input = input;
        this.context = context;
        this.imports = imports;
        this.fileInfo = fileInfo;
        return this.parse();
    }
    parse() {
        const input = this.input;
        const commentHandler = new _CommentHandler__WEBPACK_IMPORTED_MODULE_1__["default"](input, this.throwLessError);
        const themePropertyHandler = new _ThemePropertyHandler__WEBPACK_IMPORTED_MODULE_2__["default"](this.throwLessError);
        const properties = themePropertyHandler.handleInput(input, commentHandler, this.themeIdentityKeyWord);
        let index = 0;
        let result = properties.reduce((output, el) => {
            output += input.slice(index, el.start);
            // 校验el.value是否符合格式规范
            if (!/theme\(((@\S+)|(\{([\s\S]*)\}))\)/.test(el.value)) {
                this.throwLessError(el.start, `Invalid ${this.themeIdentityKeyWord} value.`);
            }
            let value = el.value.slice(`${this.themeIdentityKeyWord}(`.length, -1);
            output += this.themePropertyValueHandler({ key: el.name, value: value });
            index = el.end + 1;
            return output;
        }, '');
        if (index < input.length) {
            result += input.slice(index);
        }
        return result;
    }
}


/***/ })

})
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9idWlsZC90ZXN0LnRzIiwid2VicGFjazovLy8uL3NyYy9wYXJzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUE2QjtBQUNPO0FBRXBDLE1BQU0sTUFBTSxHQUFHLElBQUksK0NBQU0sRUFBRTtBQUMzQixJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLHdEQUFLLEVBQUUsRUFBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBQyxDQUFDO0FBQzVFLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDOzs7Ozs7Ozs7Ozs7O0FDTG5CO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBc0Q7QUFDUjtBQUNZO0FBVzNDLE1BQU0sTUFBTTtJQVN2QixZQUFZLE9BQW9CO1FBUnhCLFVBQUssR0FBVyxFQUFFO1FBU3RCLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxPQUFPLElBQUksT0FBTyxDQUFDLG9CQUFvQixJQUFJLE9BQU87UUFDOUUsSUFBSSxDQUFDLHlCQUF5QixHQUFHLE9BQU8sSUFBSSxPQUFPLENBQUMseUJBQXlCO1lBQ3pFLFVBQVUsRUFBQyxHQUFHLEVBQUUsS0FBSyxFQUFDO2dCQUNsQixPQUFPLFFBQVEsS0FBSzs7O3NDQUdFLEdBQUc7O2dDQUVUO1lBQ3BCLENBQUM7UUFDTCxJQUFJLENBQUMsY0FBYyxHQUFHLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFO1lBQ3JDLE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDO1FBQzVCLENBQUM7SUFDTCxDQUFDO0lBRUQsT0FBTyxDQUFDLEtBQWEsRUFBRSxFQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFtRDtRQUNqRyxJQUFJLENBQUMsY0FBYyxHQUFHLHNEQUFTLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDLGNBQWM7UUFDL0QsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLO1FBQ2xCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTztRQUN0QixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU87UUFDdEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRO1FBQ3hCLE9BQU8sSUFBSSxDQUFDLEtBQUssRUFBRTtJQUN2QixDQUFDO0lBRU8sS0FBSztRQUNULE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLO1FBQ3hCLE1BQU0sY0FBYyxHQUFHLElBQUksdURBQWMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQztRQUNyRSxNQUFNLG9CQUFvQixHQUFHLElBQUksNkRBQW9CLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQztRQUMxRSxNQUFNLFVBQVUsR0FBRyxvQkFBb0IsQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLGNBQWMsRUFBRSxJQUFJLENBQUMsb0JBQW9CLENBQUM7UUFDckcsSUFBSSxLQUFLLEdBQUcsQ0FBQztRQUNiLElBQUksTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUU7WUFDMUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUM7WUFDdEMscUJBQXFCO1lBQ3JCLElBQUksQ0FBQyxtQ0FBbUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUNyRCxJQUFJLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsV0FBVyxJQUFJLENBQUMsb0JBQW9CLFNBQVMsQ0FBQzthQUMvRTtZQUNELElBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sSUFBSSxJQUFJLENBQUMseUJBQXlCLENBQUMsRUFBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFDLENBQUM7WUFDdEUsS0FBSyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQztZQUNsQixPQUFPLE1BQU07UUFDakIsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUNOLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUU7WUFDdEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO1NBQy9CO1FBQ0QsT0FBTyxNQUFNO0lBQ2pCLENBQUM7Q0FDSiIsImZpbGUiOiJhcHAuYTkzYWI5ZTA3MTJjMTc0MmU2MDAuaG90LXVwZGF0ZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBQYXJzZXIgZnJvbSAnQC9wYXJzZXInXG5pbXBvcnQgaW5wdXQgZnJvbSAnQHRlc3QvaW5wdXQubGVzcydcblxuY29uc3QgcGFyc2VyID0gbmV3IFBhcnNlcigpXG5sZXQgcmVzdWx0ID0gcGFyc2VyLnByb2Nlc3MoaW5wdXQsIHtjb250ZXh0OiAnJywgZmlsZUluZm86ICcnLCBpbXBvcnRzOiBbXX0pXG5jb25zb2xlLmxvZyhyZXN1bHQpXG5cbiIsImltcG9ydCBFcnJvclV0aWwsIHtUaHJvd0xlc3NFcnJvckZ1bmN9IGZyb20gXCJAL3V0aWxzXCI7XG5pbXBvcnQgQ29tbWVudEhhbmRsZXIgZnJvbSBcIkAvQ29tbWVudEhhbmRsZXJcIjtcbmltcG9ydCBUaGVtZVByb3BlcnR5SGFuZGxlciBmcm9tIFwiQC9UaGVtZVByb3BlcnR5SGFuZGxlclwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFByb3BlcnR5SGFuZGxlclR5cGUge1xuICAgIChvcHRpb246IHsga2V5OiBzdHJpbmc7IHZhbHVlOiBzdHJpbmcgfSk6IHN0cmluZ1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE9wdGlvblR5cGUge1xuICAgIHRoZW1lSWRlbnRpdHlLZXlXb3JkPzogc3RyaW5nLFxuICAgIHRoZW1lUHJvcGVydHlWYWx1ZUhhbmRsZXI/OiBQcm9wZXJ0eUhhbmRsZXJUeXBlXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFBhcnNlciB7XG4gICAgcHJpdmF0ZSBpbnB1dDogc3RyaW5nID0gJydcbiAgICBwcml2YXRlIGNvbnRleHQ6IGFueVxuICAgIHByaXZhdGUgaW1wb3J0czogYW55XG4gICAgcHJpdmF0ZSBmaWxlSW5mbzogYW55XG4gICAgcHJpdmF0ZSB0aHJvd0xlc3NFcnJvcjogVGhyb3dMZXNzRXJyb3JGdW5jXG4gICAgcHJpdmF0ZSByZWFkb25seSB0aGVtZUlkZW50aXR5S2V5V29yZDogc3RyaW5nXG4gICAgcHJpdmF0ZSByZWFkb25seSB0aGVtZVByb3BlcnR5VmFsdWVIYW5kbGVyOiBQcm9wZXJ0eUhhbmRsZXJUeXBlXG5cbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zPzogT3B0aW9uVHlwZSkge1xuICAgICAgICB0aGlzLnRoZW1lSWRlbnRpdHlLZXlXb3JkID0gb3B0aW9ucyAmJiBvcHRpb25zLnRoZW1lSWRlbnRpdHlLZXlXb3JkIHx8ICd0aGVtZSdcbiAgICAgICAgdGhpcy50aGVtZVByb3BlcnR5VmFsdWVIYW5kbGVyID0gb3B0aW9ucyAmJiBvcHRpb25zLnRoZW1lUHJvcGVydHlWYWx1ZUhhbmRsZXIgfHxcbiAgICAgICAgICAgIGZ1bmN0aW9uICh7a2V5LCB2YWx1ZX0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYGVhY2goJHt2YWx1ZX0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAY2xhc3M6IHJlcGxhY2UoQGtleSwgJ0AnLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5Ae2NsYXNzfSAmIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR7a2V5fTogQHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7YFxuICAgICAgICAgICAgfVxuICAgICAgICB0aGlzLnRocm93TGVzc0Vycm9yID0gKGluZGV4LCBtZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb2Nlc3MoaW5wdXQ6IHN0cmluZywge2NvbnRleHQsIGltcG9ydHMsIGZpbGVJbmZvfTogeyBjb250ZXh0OiBhbnksIGltcG9ydHM6IGFueSwgZmlsZUluZm86IHN0cmluZyB9KSB7XG4gICAgICAgIHRoaXMudGhyb3dMZXNzRXJyb3IgPSBFcnJvclV0aWwoZmlsZUluZm8sIGlucHV0KS50aHJvd0xlc3NFcnJvclxuICAgICAgICB0aGlzLmlucHV0ID0gaW5wdXRcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dFxuICAgICAgICB0aGlzLmltcG9ydHMgPSBpbXBvcnRzXG4gICAgICAgIHRoaXMuZmlsZUluZm8gPSBmaWxlSW5mb1xuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZSgpXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBwYXJzZSgpIHtcbiAgICAgICAgY29uc3QgaW5wdXQgPSB0aGlzLmlucHV0XG4gICAgICAgIGNvbnN0IGNvbW1lbnRIYW5kbGVyID0gbmV3IENvbW1lbnRIYW5kbGVyKGlucHV0LCB0aGlzLnRocm93TGVzc0Vycm9yKVxuICAgICAgICBjb25zdCB0aGVtZVByb3BlcnR5SGFuZGxlciA9IG5ldyBUaGVtZVByb3BlcnR5SGFuZGxlcih0aGlzLnRocm93TGVzc0Vycm9yKVxuICAgICAgICBjb25zdCBwcm9wZXJ0aWVzID0gdGhlbWVQcm9wZXJ0eUhhbmRsZXIuaGFuZGxlSW5wdXQoaW5wdXQsIGNvbW1lbnRIYW5kbGVyLCB0aGlzLnRoZW1lSWRlbnRpdHlLZXlXb3JkKVxuICAgICAgICBsZXQgaW5kZXggPSAwXG4gICAgICAgIGxldCByZXN1bHQgPSBwcm9wZXJ0aWVzLnJlZHVjZSgob3V0cHV0LCBlbCkgPT4ge1xuICAgICAgICAgICAgb3V0cHV0ICs9IGlucHV0LnNsaWNlKGluZGV4LCBlbC5zdGFydClcbiAgICAgICAgICAgIC8vIOagoemqjGVsLnZhbHVl5piv5ZCm56ym5ZCI5qC85byP6KeE6IyDXG4gICAgICAgICAgICBpZiAoIS90aGVtZVxcKCgoQFxcUyspfChcXHsoW1xcc1xcU10qKVxcfSkpXFwpLy50ZXN0KGVsLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHRoaXMudGhyb3dMZXNzRXJyb3IoZWwuc3RhcnQsIGBJbnZhbGlkICR7dGhpcy50aGVtZUlkZW50aXR5S2V5V29yZH0gdmFsdWUuYClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IGVsLnZhbHVlLnNsaWNlKGAke3RoaXMudGhlbWVJZGVudGl0eUtleVdvcmR9KGAubGVuZ3RoLCAtMSlcbiAgICAgICAgICAgIG91dHB1dCArPSB0aGlzLnRoZW1lUHJvcGVydHlWYWx1ZUhhbmRsZXIoe2tleTogZWwubmFtZSwgdmFsdWU6IHZhbHVlfSlcbiAgICAgICAgICAgIGluZGV4ID0gZWwuZW5kICsgMVxuICAgICAgICAgICAgcmV0dXJuIG91dHB1dFxuICAgICAgICB9LCAnJylcbiAgICAgICAgaWYgKGluZGV4IDwgaW5wdXQubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXN1bHQgKz0gaW5wdXQuc2xpY2UoaW5kZXgpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdFxuICAgIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiIn0=