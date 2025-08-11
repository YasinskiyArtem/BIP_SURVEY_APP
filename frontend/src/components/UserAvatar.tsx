

import * as React from "react";
import Image from "next/image";

type UserAvatarProps = {
  user: {
    name?: string | null;
    image?: string | null;
  };
  className?: string;
};

const UserAvatar = ({ user, className }: UserAvatarProps) => {
  return (
    <div className={`relative inline-flex items-center justify-center overflow-hidden rounded-full ${className}`}>
      {user.image ? (
        <Image
          src={user.image}
          alt={user.name || "User Avatar"}
          width={40}
          height={40}
          className="object-cover w-full h-full"
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-gray-300 text-black font-bold uppercase">
          {user.name ? user.name.charAt(0) : "?"}
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
