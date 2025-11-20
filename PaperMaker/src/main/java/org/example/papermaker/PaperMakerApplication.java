package org.example.papermaker;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
public class PaperMakerApplication {

    public static void main(String[] args) {
        SpringApplication.run(PaperMakerApplication.class, args);
    }

}
