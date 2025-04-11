const navItems = document.querySelectorAll(".nav-item");
navItems.forEach((item) => {
    item.addEventListener("click", () => {
        navItems.forEach((el) => el.classList.remove("active"));
        item.classList.add("active");
    });
});
// 슬라이드 좌우 버튼 작동
const leftBtn = document.querySelector(".arrow.left");
const rightBtn = document.querySelector(".arrow.right");
const slideTrack = document.querySelector(".ott-slide-track");

const scrollAmount = 300;

leftBtn.addEventListener("click", () => {
    slideTrack.scrollBy({
        left: -scrollAmount,
        behavior: "smooth"
    });
});

rightBtn.addEventListener("click", () => {
    slideTrack.scrollBy({
        left: scrollAmount,
        behavior: "smooth"
    });
});

let currentPostIndex = 0;
let postList = [];

document.addEventListener("DOMContentLoaded", function () {
    const ottList = JSON.parse(localStorage.getItem("selectedOtt")) || [];


    if (ottList.length > 0) {
        fetch("/genre/save-ott", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ ottPlatform: ottList })
        }).then(res => {
            if (res.ok) {
                console.log("✅ OTT 저장 완료");
                localStorage.removeItem("selectedOtt"); // 저장 후 정리

                // ✅ 메인 페이지 새로고침 or 이동
                window.location.href = "/main"; // 또는 window.location.reload();
            } else {
                console.error("❌ OTT 저장 실패");
            }
        });
    }

    const slideItems = document.querySelectorAll(".slide-item");
    slideItems.forEach(item => {
        item.addEventListener("click", function (event) {
            event.preventDefault();
            const selectedTitle = item.getAttribute("data-title");

            fetch("/genre/save-title", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ selectedTitle })
            })
                .then(res => {
                    if (res.ok) {
                        console.log("✅ 선택 제목 저장 완료:", selectedTitle);

                        // ✅ 선택 기반 추천 AJAX 요청
                        fetch(`/ai/selected?title=${encodeURIComponent(selectedTitle)}`)
                            .then(res => res.json())
                            .then(data => {
                                const track = document.querySelector(".ott-slide-track");
                                track.innerHTML = ""; // 기존 슬라이드 비움

                                if (!data || data.length === 0) {
                                    track.innerHTML = "<p>추천 결과가 없습니다.</p>";
                                    return;
                                }

                                data.forEach(item => {
                                    const a = document.createElement("a");
                                    a.href = "#";
                                    a.className = "ott-card";

                                    const img = document.createElement("img");
                                    img.src = item.poster || "/images/no-image.png";
                                    img.alt = item.title;

                                    a.appendChild(img);
                                    track.appendChild(a);
                                });


                                fetch(`/posts/by-title?title=${encodeURIComponent(selectedTitle)}`)
                                    .then(res => {
                                        if (!res.ok) {
                                            postList = []; // 🔥 이전 게시글 리스트 초기화
                                            currentPostIndex = 0;

                                            // 🔥 화면 초기화
                                            document.querySelector(".review-preview").innerHTML = `
                                                <div class="review-text">
                                                    <p>📭 해당 콘텐츠에 대한 게시글이 없습니다.</p>
                                                </div>
                                            `;
                                            updateArrowButtons();
                                            return;
                                        }
                                        return res.json();
                                    })
                                    .then(posts => {
                                        if (!posts) return;

                                        postList = posts;
                                        currentPostIndex = 0;


                                        // 🔥 새 게시글 출력
                                        if (postList.length > 0) {
                                            updateReviewSection(postList[currentPostIndex]);
                                            updateArrowButtons();
                                        } else {
                                            showNoPostMessage();
                                        }
                                    });


                                console.log("✅ 추천 결과 동적 반영 완료");
                            });
                    } else {
                        console.error("❌ 제목 저장 실패");
                    }
                });
        });
    });


});
document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("ott-search");
    const contentSelection = document.querySelector(".content-selection");

    searchInput.addEventListener("input", function () {
        const keyword = searchInput.value.trim();

        if (keyword === "") {
            contentSelection.innerHTML = "";
            contentSelection.style.display = "none";
            return;
        }

        fetch(`/posts/search?keyword=${encodeURIComponent(keyword)}`)
            .then((response) => response.json())
            .then((data) => {
                contentSelection.innerHTML = "";
                contentSelection.style.display = "block";  // ✅ 수정된 부분!

                if (data.length === 0) {
                    contentSelection.innerHTML = "<p>검색 결과가 없습니다.</p>";
                    return;
                }

                data.forEach((content) => {
                    const box = document.createElement("div");
                    box.className = "content-box";

                    const img = document.createElement("img");
                    img.src = content.posterImg || "/images/no-image.png";
                    img.alt = content.title;

                    const title = document.createElement("p");
                    title.className = "content-title";
                    title.textContent = content.title;

                    box.appendChild(img);
                    box.appendChild(title);

                    box.addEventListener("click", () => {
                        sessionStorage.setItem("selectedTitle", content.title);
                        sessionStorage.setItem("selectedPoster", content.posterImg);
                        alert(`"${content.title}"을(를) 선택하셨습니다.`);

                        contentSelection.innerHTML = "";
                        contentSelection.style.display = "none";
                    });

                    contentSelection.appendChild(box);
                });
            })
            .catch((error) => {
                console.error("검색 중 오류:", error);
                contentSelection.innerHTML = "<p>검색 오류가 발생했습니다.</p>";
                contentSelection.style.display = "block";
            });
    });

    // 검색창 외 클릭 시 결과 박스 숨김
    document.addEventListener("click", function (e) {
        const searchBox = document.querySelector(".search-box");

        if (!searchBox.contains(e.target)) {
            contentSelection.innerHTML = "";
            contentSelection.style.display = "none";
        }
    });
});

function updateReviewSection(post) {
    const section = document.querySelector(".review-preview");

    // 초기 슬라이드 효과 (투명 + 오른쪽에서 들어오는 느낌)
    section.style.opacity = 0;
    section.style.transform = "translateX(30px)";

    // 이미지 처리
    const fileFields = ['postFile1', 'postFile2', 'postFile3'];
    let imagesHtml = '';

    fileFields.forEach(field => {
        const rawPath = post[field];
        if (rawPath) {
            // 윈도우 경로에서 파일명만 추출
            const fileName = rawPath.split("\\").pop().split("/").pop(); // 둘 다 고려
            const imgSrc = `/uploads/${fileName}`; // uploads로 맵핑

            imagesHtml += `<img src="${imgSrc}" alt="콘텐츠 이미지" style="max-width: 100%; margin-bottom: 10px;" />`;
        }
    });


    setTimeout(() => {
        section.innerHTML = `
            <div class="review-header">
                <img src="/img/pjg.png" class="profile-img" alt="프로필 이미지" />
                <div class="user-info">
                    <strong>${post.nickname}</strong>
                    <p class="sub">${post.postTitle}</p>
                </div>
                <button class="follow-btn">팔로우</button>
            </div>

            <div class="review-thumbnail">
                ${imagesHtml} <!-- 이미지 렌더링 -->
            </div>
            
            

            <div class="review-stats">
                <span>❤️ ${post.postRating}</span>
                <span>💬 댓글</span>
            </div>

            <div class="review-text">
                <p>${(post.postContent || '').replace(/\n/g, '<br>')}</p>
            </div>

            <div class="review-comment">
                <input type="text" placeholder="댓글을 입력하세요..." />
                <button class="comment-btn">💬 댓글</button>
            </div>          
            
            <div class ="comment-list"></div>
        `;

        // 댓글 등록 이벤트 바인딩
        const commentBtn = section.querySelector(".comment-btn");
        const commentInput = section.querySelector(".review-comment input");

        commentBtn.addEventListener("click", () => {
            const content = commentInput.value.trim();
            if (!content) {
                alert("댓글 내용을 입력해주세요.");
                return;
            }

            const postSeq = post.postSeq;

            fetch("/api/comments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    postSeq: postSeq,
                    content: content,
                    superSeq: 0
                })
            }).then((res) => {
                if (res.ok) {
                    commentInput.value = "";
                    // 댓글 목록 새로고침
                     loadComments(postSeq);
                } else {
                    alert("댓글 등록에 실패했습니다.");
                }
            });
        });

        //댓글 새로고침 함수 호출
        loadComments(post.postSeq);

        // 복원 효과
        section.style.opacity = 1;
        section.style.transform = "translateX(0)";
    }, 100);


}

function loadComments(postSeq) {
    const commentList = document.querySelector(".comment-list");
    commentList.innerHTML = "<p>댓글 불러오는 중...</p>";

    fetch(`/api/comments/${postSeq}`)
        .then(res => res.json())
        .then(data => {
            if (!data || data.length === 0) {
                commentList.innerHTML = "<p>아직 댓글이 없습니다.</p>";
                return;
            }

            commentList.innerHTML = "";
            data.forEach(comment => {
                const div = document.createElement("div");
                div.className = "single-comment";
                div.innerHTML = `
                     <div class = "comment-top">
                        <strong>${comment.username || '익명'}</strong>
                     </div>                    
                    <p class="comment-content">${comment.content}</p>
                    <button type="button" onclick="deleteComment(${comment.id}, ${postSeq});" class ="d_btns">
                    <span class="icons icon_del">삭제</span>
                    </button>
                    <div class="comment-meta">
                        <span>${comment.createdAt}</span>
                        <span>❤️ ${comment.likes}</span>
                    </div>
                `;
                commentList.appendChild(div);
            });
        })
        .catch(() => {
            commentList.innerHTML = "<p>댓글을 불러오지 못했습니다.</p>";
        });
}

function deleteComment(id, postSeq) {
    if(!confirm('해당 댓글을 삭제할까요?')){
        return;
    }

    fetch(`/api/comments/${id}`,{
        method: 'DELETE'
    })
        .then(res => {
            if(res.ok){
                loadComments(postSeq);
            }else{
                alert('댓글 삭제 초☆실★패');
            }
        })
        .catch(()=> {
            alert('서버 오류');
        });
}






document.querySelector(".post-arrow.left").addEventListener("click", () => {
    if (currentPostIndex > 0) {
        currentPostIndex--;
        updateReviewSection(postList[currentPostIndex]);
        updateArrowButtons();
    }
});

document.querySelector(".post-arrow.right").addEventListener("click", () => {
    if (currentPostIndex < postList.length - 1) {
        currentPostIndex++;
        updateReviewSection(postList[currentPostIndex]);
        updateArrowButtons();
    }
});

function updateArrowButtons() {
    document.querySelector(".post-arrow.left").disabled = currentPostIndex === 0;
    document.querySelector(".post-arrow.right").disabled = currentPostIndex === postList.length - 1;
}

function showNoPostMessage() {
    document.querySelector(".review-preview").innerHTML = `
        <div class="review-text">
            <p>📭 해당 콘텐츠에 대한 게시글이 아직 없습니다.</p>
        </div>
    `;
}
