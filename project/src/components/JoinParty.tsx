import React from 'react';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { ArrowLeft, Upload } from 'lucide-react';
import { useParty } from '../hooks/useParty';
import { useNavigate } from 'react-router-dom';

interface JoinPartyForm {
  code: string;
  playerName: string;
  profilePicture?: FileList;
}

export const JoinParty: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { joinParty, loading, error } = useParty();
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, watch } = useForm<JoinPartyForm>();
  
  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    onDrop: files => setValue('profilePicture', files as unknown as FileList)
  });

  const onSubmit = async (data: JoinPartyForm) => {
    try {
      const party = await joinParty({
        code: data.code,
        playerName: data.playerName,
        profilePicture: data.profilePicture?.[0],
      });
      navigate(`/game/${party.id}`);
    } catch (err) {
      console.error('Failed to join party:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-800 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl p-8 max-w-md w-full border border-purple-500">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-purple-300 hover:text-purple-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Main Menu
          </button>
        </div>

        <h2 className="text-2xl font-bold text-white mb-6">Join a Party</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-purple-300 mb-1">
              Party Code
            </label>
            <input
              {...register('code', { required: true })}
              className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-white shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50 p-2"
              placeholder="Enter 6-digit code"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-300 mb-1">
              Your Name
            </label>
            <input
              {...register('playerName', { required: true })}
              className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-white shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50 p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-300 mb-2">
              Profile Picture
            </label>
            <div
              {...getRootProps()}
              className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-purple-500 transition-colors cursor-pointer"
            >
              <input {...getInputProps()} />
              {watch('profilePicture')?.[0] ? (
                <div className="flex flex-col items-center">
                  <img
                    src={URL.createObjectURL(watch('profilePicture')[0])}
                    alt="Profile preview"
                    className="w-24 h-24 rounded-full object-cover mb-2"
                  />
                  <p className="text-sm text-gray-400">Click or drag to change</p>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-400">
                    Drag & drop an image here, or click to select
                  </p>
                </>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Joining Party...' : 'Join Party'}
          </button>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};