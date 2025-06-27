// 韩语单词数据库
let words = [];

// 页面加载时从JSON文件加载数据
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('./words.json');
        if (!response.ok) {
            throw new Error(`HTTP请求失败: ${response.status} ${response.statusText}`);
        }
        const text = await response.text();
        if (!text.trim()) {
            throw new Error('words.json文件内容为空');
        }
        try {
            const data = JSON.parse(text);
            if (!data || typeof data !== 'object') {
                throw new Error('JSON结构错误: 根节点必须是对象');
            }
            if (!Array.isArray(data.words)) {
                throw new Error('JSON结构错误: 缺少words数组或words不是数组类型');
            }
            if (data.words.length === 0) {
                throw new Error('JSON内容为空: words数组中没有词汇数据');
            }
            words = data.words;
            // 数据加载完成后初始化应用
            init();
        } catch (jsonError) {
            console.error('JSON解析错误:', jsonError);
            alert(`JSON格式错误: ${jsonError.message}\n错误位置: 第 ${jsonError.position} 个字符\n请使用JSON验证工具检查words.json文件格式。`);
            return;
        }

    } catch (error) {
        console.error('加载词汇数据失败:', error);
        alert(`加载词汇数据失败: ${error.message}\n错误排查步骤:\n1. 检查HTTP状态: ${response?.status || '未知'}\n2. 验证JSON结构: 确保文件包含有效的words数组\n3. 推荐操作:\n- 使用JSON验证工具: https://jsonlint.com\n- 检查文件大小: ${text.length} 字节\n- 确认文件编码: 应为UTF-8无BOM格式\n技术详情: ${error.stack}`);
    }
});

// 应用状态
let currentIndex = 0;
let favorites = JSON.parse(localStorage.getItem('koreanWordFavorites')) || [];
let showingChinese = false;
let filteredWords = [...words];

// DOM元素
const koreanWordElement = document.getElementById('korean-word');
const showChineseBtn = document.getElementById('show-chinese');
const nextWordBtn = document.getElementById('next-word');
const prevWordBtn = document.getElementById('prev-word');
const randomWordBtn = document.getElementById('random-word');
const favoriteBtn = document.getElementById('favorite-word');
const favoritesListBtn = document.getElementById('favorites-list-btn');
const categoryFilter = document.getElementById('category-filter');

// 初始化
function init() {
    // 确保words数组和filteredWords数组已正确初始化
    if (!words || words.length === 0) {
        words = [{korean: '初始化错误', chinese: '未加载词汇数据', category: 'error'}];
    }
    filteredWords = [...words];
    renderWord();
    updateFavoriteButton();
    setupEventListeners();
}

// 渲染当前单词
function renderWord() {
    const currentWord = filteredWords[currentIndex];
    if (!currentWord) {
        koreanWordElement.textContent = '没有找到词汇数据';
        return;
    }
    koreanWordElement.textContent = currentWord.korean;
    if (showingChinese) {
        koreanWordElement.textContent += ` (${currentWord.chinese})`;
    }
}

// 设置事件监听器
function setupEventListeners() {
    showChineseBtn.addEventListener('click', toggleChinese);
    nextWordBtn.addEventListener('click', showNextWord);
    prevWordBtn.addEventListener('click', showPrevWord);
    randomWordBtn.addEventListener('click', showRandomWord);
    favoriteBtn.addEventListener('click', toggleFavorite);

    categoryFilter.addEventListener('change', filterByCategory);
}

// 切换中文显示
function toggleChinese() {
    showingChinese = !showingChinese;
    renderWord();
}

// 显示下一个单词
function showNextWord() {
    currentIndex = (currentIndex + 1) % filteredWords.length;
    renderWord();
    updateFavoriteButton();
}

// 显示上一个单词
function showPrevWord() {
    currentIndex = (currentIndex - 1 + filteredWords.length) % filteredWords.length;
    renderWord();
    updateFavoriteButton();
}

// 显示随机单词
function showRandomWord() {
    currentIndex = Math.floor(Math.random() * filteredWords.length);
    renderWord();
    updateFavoriteButton();
}

// 切换收藏状态
function toggleFavorite() {
    const currentWord = filteredWords[currentIndex];
    const index = favorites.findIndex(word => word.korean === currentWord.korean);

    if (index === -1) {
        // 添加到收藏
        favorites.push({...currentWord});
    } else {
        // 从收藏中移除
        favorites.splice(index, 1);
    }

    localStorage.setItem('koreanWordFavorites', JSON.stringify(favorites));
    updateFavoriteButton();
}

// 更新收藏按钮状态
function updateFavoriteButton() {
    const currentWord = filteredWords[currentIndex];
    const isFavorite = favorites.some(word => word.korean === currentWord.korean);
    // 保留图标，只更新文本内容
    const buttonContent = isFavorite ? '<i class="fas fa-heart"></i> 取消收藏' : '<i class="fas fa-heart"></i> 收藏';
    favoriteBtn.innerHTML = buttonContent;
    // 强制设置背景颜色，不受其他样式影响
    favoriteBtn.style.backgroundColor = isFavorite ? '#e74c3c' : '#f44336';
}

// 根据类别筛选单词
function filterByCategory() {
    const selectedCategory = categoryFilter.value;
    
    if (selectedCategory === 'all') {
        filteredWords = [...words];
    } else if (selectedCategory === 'favorites') {
        filteredWords = [...favorites];
    } else {
        filteredWords = words.filter(word => word.category === selectedCategory);
    }
    
    // 确保filteredWords不为空且有有效数据
    if (!filteredWords || filteredWords.length === 0) {
        filteredWords = [{korean: '无匹配数据', chinese: '请尝试其他分类', category: 'error'}];
    }
    
    currentIndex = 0;
    renderWord();
}

// 收藏列表模态框功能
const favoritesModal = document.getElementById('favorites-modal');
const closeBtn = document.querySelector('.close-btn');
const favoritesListElement = document.getElementById('favorites-list');
const clearFavoritesBtn = document.getElementById('clear-favorites');

// 打开模态框
favoritesListBtn.addEventListener('click', () => {
    favoritesModal.style.display = 'flex';
    renderFavoritesList();
});

// 关闭模态框
closeBtn.addEventListener('click', () => {
    favoritesModal.style.display = 'none';
});

// 点击模态框外部关闭
window.addEventListener('click', (e) => {
    if (e.target === favoritesModal) {
        favoritesModal.style.display = 'none';
    }
});

// 渲染收藏列表
function renderFavoritesList() {
    const favorites = JSON.parse(localStorage.getItem('koreanWordFavorites') || '[]');
    
    if (favorites.length === 0) {
        favoritesListElement.innerHTML = '<p>暂无收藏单词</p>';
        return;
    }
    
    favoritesListElement.innerHTML = favorites.map(word => `
        <div class="favorite-item">
            <strong>${word.korean}</strong> - ${word.chinese}
        </div>
    `).join('');
}

// 清空收藏列表
clearFavoritesBtn.addEventListener('click', () => {
    if (confirm('确定要清空所有收藏吗？')) {
        localStorage.removeItem('koreanWordFavorites');
        favorites = [];
        renderFavoritesList();
        updateFavoriteButton();
    }
});

// 修改收藏按钮事件
function toggleFavorite() {
    const currentWord = filteredWords[currentIndex];
    const isFavorite = favorites.some(word => word.korean === currentWord.korean);
    
    if (isFavorite) {
        // 从收藏中移除
        favorites = favorites.filter(word => word.korean !== currentWord.korean);
    } else {
        // 添加到收藏
        favorites.push({...currentWord});
    }
    localStorage.setItem('koreanWordFavorites', JSON.stringify(favorites));
    updateFavoriteButton();
}