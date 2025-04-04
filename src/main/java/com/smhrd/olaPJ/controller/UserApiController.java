package com.smhrd.olaPJ.controller;

import com.smhrd.olaPJ.dto.AddUserRequest;
import com.smhrd.olaPJ.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;


@RequiredArgsConstructor
@Controller
public class UserApiController {

    private final UserService userService;

    //회원가입 호출
    @PostMapping("/user")
    public String signUp(AddUserRequest request) {
        userService.save(request); //회원가입 메서드를 호출
        return "redirect:/login"; //회원가입 완료 -> 로그인 페이지 이동
    }

    //로그아웃 호출
    @GetMapping("/logout")
    public String logout(HttpServletRequest request, HttpServletResponse response) {
        new SecurityContextLogoutHandler().logout(request, response, SecurityContextHolder.getContext().getAuthentication());
        return "redirect:/login";
    }





}
