import { APP_NAME } from "@/lib/constants";

interface Props {
  params: Promise<{ deviceId: string }>;
}

export default async function CustomerDisplayPage({ params }: Props) {
  const { deviceId } = await params;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-white text-gray-900">
      <h1 className="text-4xl font-bold">{APP_NAME}</h1>
      <p className="mt-4 text-xl text-gray-500">Selamat Datang</p>
      <p className="mt-8 text-sm text-gray-400">Device: {deviceId}</p>
    </div>
  );
}
