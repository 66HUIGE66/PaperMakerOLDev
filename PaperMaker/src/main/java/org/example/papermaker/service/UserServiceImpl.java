package org.example.papermaker.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import jakarta.annotation.Resource;
import org.example.papermaker.entity.UserEntity;
import org.example.papermaker.mapper.UserMapper;
import org.springframework.stereotype.Service;

/**
 * 用户服务实现类
 */
@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, UserEntity> implements UserService {
    
    @Resource
    private UserMapper userMapper;
    
    @Override
    public UserEntity findByUsername(String username) {
        LambdaQueryWrapper<UserEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserEntity::getUsername, username);
        return userMapper.selectOne(wrapper);
    }
    
    @Override
    public boolean login(String username, String password) {
        UserEntity user = findByUsername(username);
        return user != null && password.equals(user.getPassword());
    }
}
