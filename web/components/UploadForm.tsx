'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadFilesAction } from '@/app/actions';

type Status = 'idle' | 'uploading' | 'error';

/**
 * Builds a FormData from the selected files (loose or a whole folder) and
 * calls the uploadFilesAction server action. Each File is appended under
 * "files", with a matching "paths" entry carrying its relative path
 * (file.webkitRelativePath for a folder input, file.name for loose files).
 */
export function UploadForm({ collectionId }: { collectionId: string }) {
  const router = useRouter();
  const filesInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  async function upload(fileList: FileList | null, kind: 'files' | 'folder') {
    if (!fileList || fileList.length === 0) return;

    const formData = new FormData();
    Array.from(fileList).forEach((file) => {
      formData.append('files', file);
      const path = kind === 'folder' ? file.webkitRelativePath || file.name : file.name;
      formData.append('paths', path);
    });

    setStatus('uploading');
    setError(null);
    try {
      await uploadFilesAction(collectionId, formData);
      router.refresh();
      setStatus('idle');
    } catch (e) {
      setStatus('error');
      setError((e as Error).message);
    } finally {
      if (filesInputRef.current) filesInputRef.current.value = '';
      if (folderInputRef.current) folderInputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-content">Upload files</span>
          <input
            ref={filesInputRef}
            type="file"
            multiple
            disabled={status === 'uploading'}
            onChange={(e) => upload(e.target.files, 'files')}
            className="text-sm text-content-muted file:mr-3 file:rounded-control file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:opacity-90 disabled:opacity-50"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-content">Upload a folder</span>
          <input
            ref={folderInputRef}
            type="file"
            multiple
            // @ts-expect-error non-standard attribute, supported by Chromium/Firefox
            webkitdirectory=""
            disabled={status === 'uploading'}
            onChange={(e) => upload(e.target.files, 'folder')}
            className="text-sm text-content-muted file:mr-3 file:rounded-control file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:opacity-90 disabled:opacity-50"
          />
        </label>
      </div>

      {status === 'uploading' && (
        <p className="text-sm text-content-muted">Uploading and processing files…</p>
      )}
      {status === 'error' && (
        <p role="alert" className="text-sm text-danger-solid">
          Upload failed: {error}
        </p>
      )}
    </div>
  );
}

