import axios from 'axios';
import { useState } from 'react';

const springUrl = process.env.NEXT_PUBLIC_SPRING_BASE_URL;
const clean = (u) => (u || "").replace(/\/$/, "");

function WritePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [writer, setWriter] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${clean(springUrl)}/community`, {
        title,
        content,
        writer,
      });
      console.log('글 저장 성공:', res.data);
      setTitle('');
      setContent('');
      setWriter('');
    } catch (error) {
      console.error('글 저장 실패:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" /><br />
      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="내용" /><br />
      <input value={writer} onChange={(e) => setWriter(e.target.value)} placeholder="작성자" /><br />
      <button type="submit">글 저장</button>
    </form>
  );
}

export default WritePost;
