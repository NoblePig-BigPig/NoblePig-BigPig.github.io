"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * 檢查兩張圖片大小
 * @param img1 被比較圖片
 * @param img2 比較圖片
 * @returns
 */
function compareImageSize(img1, img2) {
    if (img1.width !== img2.width || img1.height !== img2.height) {
        alert('兩張圖片大小必須相同');
        return false;
    }
    return true;
}
/**
 * 取得圖片資料
 * @param img 分析圖片
 * @returns 分析圖片資料
 */
function getImageData(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, img.width, img.height);
}
/**
 * 找出兩張圖片的不同像素
 * @param imageData1 第一張圖片的像素數據
 * @param imageData2 第二張圖片的像素數據
 * @param threshold 顏色差異閾值
 * @returns 不同像素的數組
 */
function findDifferentPixels(imageData1, imageData2, threshold = 10) {
    const diffPixels = [];
    // 確保兩張圖片大小相同
    if (imageData1.width !== imageData2.width ||
        imageData1.height !== imageData2.height) {
        throw new Error('圖片大小不一致');
    }
    for (let y = 0; y < imageData1.height; y++) {
        for (let x = 0; x < imageData1.width; x++) {
            const index = (y * imageData1.width + x) * 4;
            // 分別取出兩張圖的RGB值
            const r1 = imageData1.data[index];
            const g1 = imageData1.data[index + 1];
            const b1 = imageData1.data[index + 2];
            const r2 = imageData2.data[index];
            const g2 = imageData2.data[index + 1];
            const b2 = imageData2.data[index + 2];
            // 計算RGB差異
            const isDiff = Math.abs(r1 - r2) > threshold ||
                Math.abs(g1 - g2) > threshold ||
                Math.abs(b1 - b2) > threshold;
            if (isDiff) {
                diffPixels.push({
                    x,
                    y,
                    r1, g1, b1, // 第一張圖的顏色
                    r2, g2, b2 // 第二張圖的顏色
                });
            }
        }
    }
    return diffPixels;
}
/**
 * 加載圖片
 * @param file 要加載的文件
 * @returns Promise<HTMLImageElement>
 */
function loadImage(file) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    });
}
/**
 * 計算異常點的包圍圓
 * @param diffPixels 異常像素數組
 * @returns 包圍圓的參數
 */
function calculateBoundingCircle(diffPixels) {
    // 計算邊界
    const minX = Math.min(...diffPixels.map(p => p.x));
    const maxX = Math.max(...diffPixels.map(p => p.x));
    const minY = Math.min(...diffPixels.map(p => p.y));
    const maxY = Math.max(...diffPixels.map(p => p.y));
    // 計算中心點和半徑
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const radiusX = (maxX - minX) / 2;
    const radiusY = (maxY - minY) / 2;
    const radius = Math.max(radiusX, radiusY) + 10;
    return { centerX, centerY, radius };
}
/**
 * 繪製異常點包圍圓
 * @param ctx 繪圖上下文
 * @param centerX 圓心X座標
 * @param centerY 圓心Y座標
 * @param radius 圓半徑
 * @param isHighlight 是否高亮顯示
 * @returns Path2D 對象
 */
function drawBoundingCircle(ctx, centerX, centerY, radius, isHighlight = false) {
    const circle = new Path2D();
    circle.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    if (isHighlight) {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 5;
        ctx.setLineDash([]); // 實線
    }
    else {
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]); // 虛線
    }
    ctx.stroke();
    return circle;
}
/**
 * 處理圖片比較的主函數
 * @param threshold 像素差異閾值，默認為10
 */
function processImages() {
    return __awaiter(this, arguments, void 0, function* (threshold = 10) {
        const file1Input = document.getElementById('image1');
        const file2Input = document.getElementById('image2');
        const file1 = file1Input.files[0];
        const file2 = file2Input.files[0];
        if (!file1 || !file2) {
            alert('請選擇兩張圖片');
            return;
        }
        const originalCanvas1 = document.getElementById('originalCanvas1');
        const originalCanvas2 = document.getElementById('originalCanvas2');
        const diffCanvas = document.getElementById('diffCanvas');
        const ctx1 = originalCanvas1.getContext('2d');
        const ctx2 = originalCanvas2.getContext('2d');
        const diffCtx = diffCanvas.getContext('2d');
        ctx1.clearRect(0, 0, originalCanvas1.width, originalCanvas1.height);
        ctx2.clearRect(0, 0, originalCanvas2.width, originalCanvas2.height);
        diffCtx.clearRect(0, 0, diffCanvas.width, diffCanvas.height);
        try {
            // 同時加載兩張圖片
            const [img1, img2] = yield Promise.all([
                loadImage(file1),
                loadImage(file2)
            ]);
            // 設置畫布大小和繪製圖片
            originalCanvas1.width = img1.width;
            originalCanvas1.height = img1.height;
            ctx1.drawImage(img1, 0, 0);
            originalCanvas2.width = img2.width;
            originalCanvas2.height = img2.height;
            ctx2.drawImage(img2, 0, 0);
            // 檢查圖片大小
            if (!compareImageSize(img1, img2)) {
                return;
            }
            // 比較圖片
            const imageData1 = getImageData(img1);
            const imageData2 = getImageData(img2);
            // 使用新的函數找出不同像素
            const diffPixels = findDifferentPixels(imageData1, imageData2, threshold);
            // TODO: 繪製異常點，目前只能抓取一個異常點，需要改成抓取多個異常點
            drawBoundingCircle_multiple(diffPixels, img1, img2, diffCanvas, diffCtx);
            return diffPixels;
        }
        catch (error) {
            console.error('圖片加載錯誤', error);
            alert('圖片加載失敗');
            return [];
        }
    });
}
/**
 * 將差異點分組
 * @param diffPixels 所有差異像素
 * @param maxDistance 最大聚類距離
 * @returns 分組後的差異點數組
 */
function clusterDiffPixels(diffPixels, maxDistance = 50) {
    // 如果差異點數量太少，直接返回
    if (diffPixels.length <= 1)
        return [diffPixels];
    const clusters = [];
    const used = new Set();
    for (let i = 0; i < diffPixels.length; i++) {
        if (used.has(i))
            continue;
        const currentCluster = [diffPixels[i]];
        used.add(i);
        for (let j = i + 1; j < diffPixels.length; j++) {
            if (used.has(j))
                continue;
            const distance = Math.sqrt(Math.pow(diffPixels[i].x - diffPixels[j].x, 2) +
                Math.pow(diffPixels[i].y - diffPixels[j].y, 2));
            if (distance <= maxDistance) {
                currentCluster.push(diffPixels[j]);
                used.add(j);
            }
        }
        clusters.push(currentCluster);
    }
    return clusters;
}
// 修改 drawBoundingCircle_multiple 函數
function drawBoundingCircle_multiple(diffPixels, img1, img2, diffCanvas, diffCtx) {
    // 設置差異圖Canvas
    diffCanvas.width = img1.width;
    diffCanvas.height = img1.height;
    diffCtx.drawImage(img2, 0, 0);
    // 將差異點分組
    const pixelClusters = clusterDiffPixels(diffPixels);
    // 儲存所有圓形
    const allCircles = [];
    // 為每個聚類繪製包圍圓
    pixelClusters.forEach(cluster => {
        // 計算當前聚類的包圍圓
        const { centerX, centerY, radius } = calculateBoundingCircle(cluster);
        // 在差異圖上畫圓
        const circle = drawBoundingCircle(diffCtx, centerX, centerY, radius);
        // 儲存圓形
        allCircles.push(circle);
    });
    // 顯示差異百分比
    const diffPercentage = (diffPixels.length / (img1.width * img1.height)) * 100;
    const diffInfoElement = document.getElementById('diff-info');
    if (diffInfoElement) {
        diffInfoElement.textContent = `差異像素百分比: ${diffPercentage.toFixed(2)}%
                                       差異像素數量: ${diffPixels.length}
                                       總像素數量: ${img1.width * img1.height}
                                       聚類數量: ${pixelClusters.length}
                                       詳細差異: ${JSON.stringify(pixelClusters.map(cluster => ({
            count: cluster.length,
            center: calculateBoundingCircle(cluster)
        })))}`;
    }
    console.log(`差異像素聚類: `, pixelClusters);
}
//# sourceMappingURL=visual.js.map