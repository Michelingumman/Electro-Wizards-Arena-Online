import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { Gamepad, Upload } from 'lucide-react';
import { useParty } from '../hooks/useParty';
import { useNavigate } from 'react-router-dom';
import { JoinParty } from './JoinParty';

interface PartySetupForm {
  playerName: string;
  profilePicture?: FileList;
}

export const PartySetup: React.FC = () => {
  const [showJoinParty, setShowJoinParty] = useState(false);
  const { createParty, loading, error } = useParty();
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, watch } = useForm<PartySetupForm>();
  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    onDrop: files => setValue('profilePicture', files as unknown as FileList)
  });

  const onCreateParty = async (data: PartySetupForm) => {
    try {
      const party = await createParty(
        data.playerName,
        data.profilePicture?.[0]
      );
      navigate(`/game/${party.id}`);
    } catch (err) {
      console.error('Failed to create party:', err);
    }
  };

  if (showJoinParty) {
    return <JoinParty onBack={() => setShowJoinParty(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-800 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl p-8 max-w-md w-full border border-purple-500">
        <div className="flex items-center justify-center mb-8">
          <Gamepad className="w-12 h-12 text-purple-400" />
          <h1 className="text-3xl font-bold text-white ml-3">Not Enough Mana</h1>
        </div>

        {error && (
          <div className="bg-red-500 text-white p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onCreateParty)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-purple-300">
              Your Name
            </label>
            <input
              {...register('playerName', { required: true })}
              className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-white shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
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
            {loading ? 'Creating Party...' : 'Create New Party'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-gray-400">or</span>
        </div>

        <button
          onClick={() => setShowJoinParty(true)}
          className="mt-4 w-full bg-gray-800 text-purple-400 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors border border-purple-500"
        >
          Join Existing Party
        </button>
      </div>
    </div>
  );
};