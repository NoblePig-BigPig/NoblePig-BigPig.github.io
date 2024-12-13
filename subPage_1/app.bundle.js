"use strict";
/**
 * 運行白鷺引擎框架
 */
function runEgret() {
    var loadScript = function (list, callback) {
        var loaded = 0;
        var loadNext = function () {
            loadSingleScript(list[loaded], function () {
                loaded++;
                if (loaded >= list.length) {
                    callback();
                }
                else {
                    loadNext();
                }
            })
        };
        loadNext();
    };

    var loadSingleScript = function (src, callback) {
        var s = document.createElement('script');
        s.async = false;
        s.src = src;

        const foo = function () {
            s.parentNode.removeChild(s);
            s.removeEventListener('load', foo, false);
            callback();
        }
        s.addEventListener('load', foo, false);
        document.body.appendChild(s);
    };

    var xhr = new XMLHttpRequest();
    xhr.open('GET', './manifest.json?v=' + Math.random(), true);
    xhr.addEventListener("load", function () {
        var manifest = JSON.parse(xhr.response);
        var list = manifest.initial.concat(manifest.game);
        loadScript(list, function () {
            /**
             * {
             * "renderMode":, //Engine rendering mode, "canvas" or "webgl"
             * "audioType": 0 //Use the audio type, 0: default, 2: web audio, 3: audio
             * "antialias": //Whether the anti-aliasing is enabled in WebGL mode, true: on, false: off, defaults to false
             * "calculateCanvasScaleFactor": //a function return canvas scale factor
             * }
             **/
            egret.runEgret({
                renderMode: "webgl", audioType: 0, calculateCanvasScaleFactor: function (context) {
                    var backingStore = context.backingStorePixelRatio ||
                        context.webkitBackingStorePixelRatio ||
                        context.mozBackingStorePixelRatio ||
                        context.msBackingStorePixelRatio ||
                        context.oBackingStorePixelRatio ||
                        context.backingStorePixelRatio || 1;
                    return (window.devicePixelRatio || 1) / backingStore;
                },
                pro: false
            });
        });
    });
    xhr.send(null);
}

/**
 * 運行代碼，在載入白鷺引擎代碼之前
 * @param {Function} logic 框架載入前的流程邏輯
 * @returns 
 */
function runBeforeEgret(logic) {
    return new Promise((resolve, reject) => {
        logic(resolve);
    })
}

/**
 * ※Javascript Entry / JS進入點 / 應用進入點
 */
runBeforeEgret(async (done) => {
    // 這邊負責撰寫框架載入前的流程...


    // 預處理流程結束，開始載入框架
    done();
}).then(runEgret).catch((err) => {
    console.error(`載入白鷺引擎框架前發生錯誤，請確認預處理流程!`, err);
});

//******************************************************************************************************
// Define a function to load the Google Analytics script
function loadGoogleAnalytics() {
    // Create a new script element
    var script = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-T4WJPF1W2E';

    // Append the script to the document body
    document.body.appendChild(script);

    // Once the script is loaded, initialize Google Analytics
    script.onload = function () {
        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        gtag('js', new Date());
        gtag('config', 'G-T4WJPF1W2E');
    }
}
// Call the function to load Google Analytics
loadGoogleAnalytics();