package org.example.papermaker.service;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import jakarta.annotation.Resource;
import org.example.papermaker.config.OssConfig;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.UUID;

@Service
public class OssService {

    @Resource
    private OssConfig ossConfig;

    public String uploadFile(MultipartFile file) {
        try {
            return uploadFile(file.getInputStream(), file.getOriginalFilename());
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }

    public String uploadFile(InputStream inputStream, String originalFilename) {
        String endpoint = ossConfig.getEndpoint();
        String accessKeyId = ossConfig.getAccessKeyId();
        String accessKeySecret = ossConfig.getAccessKeySecret();
        String bucketName = ossConfig.getBucketName();

        try {
            // 创建OSSClient实例
            OSS ossClient = new OSSClientBuilder().build(endpoint, accessKeyId, accessKeySecret);

            // 1. 在文件名称里面添加随机唯一的值
            String uuid = UUID.randomUUID().toString().replaceAll("-", "");
            String fileName = uuid + originalFilename;

            // 2. 把文件按照日期进行分类
            Date date = new Date();
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy/MM/dd");
            String datePath = sdf.format(date);
            fileName = datePath + "/" + fileName;

            // 调用oss方法实现上传
            ossClient.putObject(bucketName, fileName, inputStream);

            // 关闭OSSClient
            ossClient.shutdown();

            // 把上传之后文件路径返回
            // https://edu-guli-1010.oss-cn-beijing.aliyuncs.com/01.jpg
            String url = "https://" + bucketName + "." + endpoint + "/" + fileName;
            return url;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
