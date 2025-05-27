import React from 'react';
import BlogManager from '../components/Blog/BlogManager';
import PageContainer from '../components/Layout/PageContainer';

const BlogPage: React.FC = () => {
  return (
    <PageContainer title="Gestion du Blog">
      <BlogManager />
    </PageContainer>
  );
};

export default BlogPage; 