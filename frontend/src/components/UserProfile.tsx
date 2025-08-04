'use client'

import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface UserProfileProps {
  user: User
  onLogout: () => void
}

export default function UserProfile({ user, onLogout }: UserProfileProps) {
  return (
    <Menu as="div" className="relative ml-3">
      <div>
        <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
          <span className="sr-only">Ouvrir le menu utilisateur</span>
          {user.avatar ? (
            <img
              className="h-8 w-8 rounded-full"
              src={user.avatar}
              alt={user.name}
            />
          ) : (
            <UserCircleIcon className="h-8 w-8 text-gray-400" />
          )}
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">
            <p className="font-medium">{user.name}</p>
            <p className="text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
          </div>
          <Menu.Item>
            {({ active }) => (
              <a
                href="/profile"
                className={`${
                  active ? 'bg-gray-100 dark:bg-gray-700' : ''
                } flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
              >
                <UserCircleIcon className="mr-3 h-5 w-5 text-gray-400" />
                Mon profil
              </a>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={onLogout}
                className={`${
                  active ? 'bg-gray-100 dark:bg-gray-700' : ''
                } flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
              >
                <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" />
                Se déconnecter
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  )
} 