package org.example.papermaker.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.example.papermaker.entity.QuestionImageEntity;
import org.example.papermaker.service.OssService;
import org.example.papermaker.service.QuestionImageService;
import org.example.papermaker.vo.RespBean;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
@Tag(name = "文件上传", description = "用于图片等文件的上传，支持阿里云OSS")
public class UploadController {

    @Resource
    private OssService ossService;

    @Resource
    private QuestionImageService questionImageService;

    @PostMapping("/image")
    @Operation(summary = "上传图片", description = "上传图片到阿里云OSS，可选关联题目ID")
    public RespBean uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "questionId", required = false) Long questionId,
            @RequestParam(value = "description", required = false) String description) {
        String url = ossService.uploadFile(file);
        if (url != null) {
            Map<String, Object> result = new HashMap<>();
            result.put("url", url);

            // 如果提供了questionId，则同时保存到question_image表
            if (questionId != null) {
                QuestionImageEntity imageEntity = questionImageService.addImage(questionId, url, description);
                result.put("imageId", imageEntity.getId());
            }

            return new RespBean(200, "上传成功", result);
        } else {
            return new RespBean(500, "上传失败", null);
        }
    }

    @DeleteMapping("/image/{imageId}")
    @Operation(summary = "删除图片", description = "删除题目关联的图片")
    public RespBean deleteImage(@PathVariable Long imageId) {
        questionImageService.deleteImage(imageId);
        return new RespBean(200, "删除成功", null);
    }
}
