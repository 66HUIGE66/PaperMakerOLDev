package org.example.papermaker.service;

import com.baomidou.mybatisplus.extension.service.IService;
import org.example.papermaker.entity.UserEntity;

/**
 * 用户服务接口
 */
public interface UserService extends IService<UserEntity> {
    
    /**
     * 根据用户名查找用户
     */
    UserEntity findByUsername(String username);
    
    /**
     * 用户登录验证
     */
    boolean login(String username, String password);
}
