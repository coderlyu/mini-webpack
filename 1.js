__webpack_require__.r(__webpack_exports__);


__webpack_require__.d(__webpack_exports__, {
   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
});

let __src_test__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src\\test.js");

let __src_sub__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./src\\sub.js");

let name = __src_sub__WEBPACK_IMPORTED_MODULE_1__.subName;

function self() {
  ;(0, __src_test__WEBPACK_IMPORTED_MODULE_0__.default)(name);
  ;(0, __src_test__WEBPACK_IMPORTED_MODULE_0__.default)(name);
  let subName = 'self';
  return subName;
}

self();
;(0, __src_test__WEBPACK_IMPORTED_MODULE_0__.default)(name);
console.log((0, __src_sub__WEBPACK_IMPORTED_MODULE_1__.subFn)(20, 9));
const __WEBPACK_DEFAULT_EXPORT__ = name;