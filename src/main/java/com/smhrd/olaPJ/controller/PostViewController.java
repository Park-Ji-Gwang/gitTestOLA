package com.smhrd.olaPJ.controller;

import com.smhrd.olaPJ.domain.Post;
import com.smhrd.olaPJ.service.PostService;
import lombok.RequiredArgsConstructor;
import org.apache.coyote.Request;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Optional;

@Controller
@RequiredArgsConstructor
@RequestMapping("/posts")
public class PostViewController {

    private final PostService postService;

    // ✅ 리뷰 업로드 + redirect
    @PostMapping("/uploadReview")
    public String uploadReview(@RequestParam("postTitle") String postTitle,
                               @RequestParam("file1") MultipartFile file1,
                               @RequestParam("file2") MultipartFile file2,
                               @RequestParam("file3") MultipartFile file3,
                               Authentication authentication) {

        String username = authentication.getName(); // 로그인한 사용자 이름
        try {

            //DB 저장후 postseq 반환
            Long postSeq = postService.uploadReview(postTitle, file1, file2, file3, username);

            System.out.println("Review photo uploaded, postSeq: " + postSeq);
            return "redirect:/review?postSeq=" + postSeq; //다음화면 + postSeq 넘김

        } catch (IOException e) {
            e.printStackTrace();
            return "error";
        }
    }

    @PostMapping("/writeReview")
    public String writeReview(@RequestParam("postSeq") Long postSeq,
                              @RequestParam("postContent") String postContent,
                              @RequestParam("postRating") int postRating,
                              Authentication authentication) {

        String username = authentication.getName();

        Optional<Post> optionalPost = postService.findPostBySeq(postSeq);
        String postTitle = optionalPost.map(Post::getPostTitle).orElse("제목없음");

        postService.updateReviewBySeq(postSeq, postContent, postRating);
        System.out.println("write Review uploaded");
        System.out.println("리뷰 번호: " + postSeq);
        System.out.println("작품 제목: " + postTitle);
        System.out.println("리뷰 내용: " + postContent);
        System.out.println("평점: " + postRating);
        System.out.println("작성자: " + username);
        return ("redirect:/main");
    }
}

