package org.example.papermaker.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Swagger配置类
 * 配置API文档的基本信息
 * 
 * @author System
 * @since 1.0.0
 */
@Configuration
public class SwaggerConfig {

    /**
     * 配置OpenAPI基本信息
     */
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("PaperMaker API文档")
                        .description("智能组卷刷题系统API接口文档")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("PaperMaker")
                                .email("papermaker@example.com")
                                .url("https://github.com/papermaker"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8080")
                                .description("本地开发环境"),
                        new Server()
                                .url("https://api.papermaker.com")
                                .description("生产环境")
                ));
    }
}

