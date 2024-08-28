document.addEventListener("DOMContentLoaded", () => {
    const apiSelect = document.getElementById("api-select");
    const searchForm = document.getElementById("search-form");
    const searchText = document.getElementById("searchText");
    const searchResult = document.getElementById("search-result");
    const showMoreBtn = document.getElementById("show-more-btn");
    const toggleHistoryBtn = document.getElementById("toggle-history-btn");
    const searchHistoryList = document.getElementById("search-history-list");
    const searchHistoryContainer = document.querySelector(".search-history");
    
    let searchQuery = "";
    let currentPage = 1;
    const history = JSON.parse(localStorage.getItem('searchHistory')) || [];

    // Fetch images based on selected API
    async function fetchImages(api, query, page) {
        let url = "";
        switch(api) {
            case "unsplash":
                url = `https://api.unsplash.com/search/photos?page=${page}&query=${query}&client_id=9PIoAp30mek58RqCEEkM5WlZsz1phu5IcbvFPPG3Pl8`;
                break;
            case "pexels":
                url = `https://api.pexels.com/v1/search?query=${query}&page=${page}&per_page=12`;
                break;
            case "pixabay":
                url = `https://pixabay.com/api/?key=45539944-6427a05e8e52796c3f76d808c&q=${query}&image_type=photo&pretty=true`;
                break;
            default:
                return;
        }

        try {
            const response = await fetch(url, {
                headers: api === "pexels" ? { Authorization: "VzMxPwuk7WtVqfdFQbAEEaKhATKdfj2ETBXmASJcinS56liCPSAhz6mf" } : {}
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching images:", error);
        }
    }

    // Render images on the page
    function renderImages(api, data) {
        let items;
        
        if (api === "pixabay") {
            items = data.hits;
        } else {
            items = data.results || data.photos || data.hits;
        }
    
        if (!items || items.length === 0) {
            searchResult.innerHTML = "<div class='notFound'><i class='fas fa-search'></i><p>No results found.</p></div>";
            return;
        }
    
        items.forEach(item => {
            const card = document.createElement("div");
            card.classList.add("card");
    
            let imgSrc, photographer, downloadUrl;
    
            if (api === "pixabay") {
                imgSrc = item.webformatURL;
                photographer = item.user;
                downloadUrl = item.largeImageURL;
            } else {
                imgSrc = item.urls ? item.urls.small : item.src.small;
                photographer = item.user ? item.user.name : item.photographer;
                downloadUrl = item.urls ? item.urls.full : item.src.original;
            }
    
            card.innerHTML = `
                <img src="${imgSrc}" alt="${searchQuery}">
                <div class="details">
                    <div class="photographer">${photographer || 'Unknown'}</div>
                    <button class="download-btn" data-download-url="${downloadUrl}">
                        <i class="fas fa-download"></i> Download
                    </button>
                </div>
            `;
    
            card.addEventListener("click", () => {
                showPopup(item, api);
            });
    
            searchResult.appendChild(card);
        });
    
        document.querySelectorAll(".download-btn").forEach(button => {
            button.addEventListener("click", (event) => {
                const downloadUrl = button.getAttribute("data-download-url");
                downloadImage(downloadUrl);
                event.stopPropagation();
            });
        });
    }

    // Handle form submission
    searchForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        searchQuery = searchText.value.trim();
        if (!searchQuery) return;

        searchResult.innerHTML = "";
        currentPage = 1;

        addSearchHistory(searchQuery);

        const api = apiSelect.value;
        const data = await fetchImages(api, searchQuery, currentPage);
        renderImages(api, data);
    });

    // Load more images on button click
    showMoreBtn.addEventListener("click", async () => {
        currentPage++;
        const api = apiSelect.value;
        const data = await fetchImages(api, searchQuery, currentPage);
        renderImages(api, data);
    });

    // Add search query to history
    function addSearchHistory(query) {
        if (!history.includes(query)) {
            history.push(query);
            localStorage.setItem('searchHistory', JSON.stringify(history));

            const li = document.createElement("li");
            li.textContent = query;
            li.addEventListener("click", () => {
                searchText.value = query;
                searchForm.dispatchEvent(new Event("submit"));
            });

            searchHistoryList.appendChild(li);
        }
    }

    // Toggle search history visibility
    toggleHistoryBtn.addEventListener("click", () => {
        searchHistoryContainer.classList.toggle("active");
    });

    // Display popup for image details
    function showPopup(item, api) {
        const popupView = document.createElement("div");
        popupView.classList.add("popupView", "show");
    
        let imgSrc, photographer;
    
        if (api === "pixabay") {
            imgSrc = item.largeImageURL;
            photographer = item.user;
        } else {
            imgSrc = item.urls ? item.urls.full : item.src.original;
            photographer = item.user ? item.user.name : item.photographer;
        }
    
        popupView.innerHTML = `
            <div class="wrapper">
                <div class="details">
                    <div class="photographer">
                        <i class="fas fa-camera"></i> ${photographer || 'Unknown'}
                    </div>
                    <button id="close-popup"><i class="fas fa-times"></i></button>
                </div>
                <div class="previewItem">
                    <img src="${imgSrc}" alt="${searchQuery}">
                </div>
            </div>
        `;
    
        document.body.appendChild(popupView);
    
        const closePopup = document.getElementById("close-popup");
        closePopup.addEventListener("click", () => {
            document.body.removeChild(popupView);
        });
    }
    
    // Download image functionality
    async function downloadImage(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok.');
            const blob = await response.blob();

            const a = document.createElement('a');
            const urlCreator = window.URL || window.webkitURL;
            const imageUrl = urlCreator.createObjectURL(blob);
            
            const filename = `image_${Date.now()}.jpg`;

            a.href = imageUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            
            document.body.removeChild(a);
            urlCreator.revokeObjectURL(imageUrl);
        } catch (error) {
            console.error('Error downloading image:', error);
        }
    }

    // Initialize history display
    function initializeHistory() {
        searchHistoryList.innerHTML = history.map(query => `<li>${query}</li>`).join('');
        searchHistoryContainer.classList.toggle("active", history.length > 0);
    }

    initializeHistory();
});
