import React from "react";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  getGetJobQueryOptions,
  getGetMyEmployerProfileQueryOptions,
} from "@workspace/api-client-react";
import { JobForm } from "@/components/JobForm";
import { JobView } from "@/components/JobView";
import { ErrorState, Loading } from "@/components/UI";
import { useAuth } from "@/lib/auth";
import { useAppStateRefetch } from "@/lib/useAppStateRefetch";

export default function JobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const auth = useAuth();
  const isEmployer =
    auth.user?.role === "employer" && auth.user.hasEmployerProfile === true;
  const isWorker = auth.user?.role === "worker";
  const q = useQuery(getGetJobQueryOptions(String(id)));
  const me = useQuery({
    ...getGetMyEmployerProfileQueryOptions(),
    enabled: isEmployer,
  });

  useAppStateRefetch(q.refetch);

  if (q.isLoading) return <Loading />;
  if (q.error || !q.data) {
    return <ErrorState message="İlan yüklenemedi." onRetry={() => q.refetch()} />;
  }
  const isOwner = isEmployer && me.data?.id === q.data.employerId;
  if (isOwner) {
    return <JobForm mode="edit" job={q.data} />;
  }
  const employerUserId = isWorker ? q.data.employerUserId : undefined;
  return <JobView job={q.data} employerUserId={employerUserId} />;
}
