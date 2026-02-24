import { FormEvent, useState } from 'react';
import { ideaApi } from '../services/idea-service';

export const IdeaSubmitPage = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [file, setFile] = useState<File | undefined>();
  const [message, setMessage] = useState('');

  const token = JSON.parse(localStorage.getItem('innovatepam.session') ?? 'null')?.token as string | undefined;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) {
      setMessage('Please login first');
      return;
    }

    await ideaApi.create(token, { title, description, category, file });
    setMessage('Idea submitted');
  };

  return (
    <main>
      <h1>Submit Idea</h1>
      <form onSubmit={onSubmit}>
        <label>
          Title
          <input aria-label="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          Description
          <textarea aria-label="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <label>
          Category
          <input aria-label="Category" value={category} onChange={(event) => setCategory(event.target.value)} />
        </label>
        <label>
          Attachment
          <input type="file" onChange={(event) => setFile(event.target.files?.[0])} />
        </label>
        <button type="submit">Submit Idea</button>
      </form>
      <p>{message}</p>
    </main>
  );
};
