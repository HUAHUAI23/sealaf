import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Center, Spinner } from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { ErrorIcon } from "@/components/CommonIcon";

import { MonitorDataType } from "../../../mods/StatusBar/MonitorBar";

import AreaCard from "./AreaCard";

import { MonitorControllerGetData } from "@/apis/v1/monitor";
import useGlobalStore from "@/pages/globalStore";

export default function AppMonitor() {
  const { t } = useTranslation();
  const { currentApp } = useGlobalStore();
  const { limitCPU, limitMemory } = currentApp.bundle.resource;

  const [dataNumber, setDataNumber] = useState(0);
  const queryClient = useQueryClient();

  const { isLoading, data: monitorData } = useQuery(
    ["useGetMonitorDataQuery"],
    () => {
      return MonitorControllerGetData({
        q: MonitorDataType,
        step: 60,
        type: "range",
      });
    },
    {
      refetchInterval: 60000,
    },
  );

  const podsArray = useMemo(() => {
    const cpuData = monitorData?.data?.cpu?.map((item: any) => item.metric.pod);
    const memoryData = monitorData?.data?.memory?.map((item: any) => item.metric.pod);
    if (!cpuData) return [t("All")];
    if (cpuData.length === 1 && memoryData.length === 1) return cpuData;
    return cpuData.length > memoryData.length ? [t("All"), ...cpuData] : [t("All"), ...memoryData];
  }, [monitorData, t]);

  const [longestTick, setLongestTick] = useState("");

  return (
    <div className="flex w-full">
      {isLoading ? (
        <Center className="h-[400px] w-full">
          <Spinner />
        </Center>
      ) : monitorData?.data && Object.keys(monitorData?.data).length !== 0 ? (
        <div className="mr-4 mt-10 h-[440px] w-full rounded-xl border bg-[#F8FAFB] pb-4">
          <AreaCard
            data={monitorData?.data?.cpu}
            strokeColor="#47C8BF"
            fillColor="#E6F6F6"
            setDataNumber={setDataNumber}
            dataNumber={dataNumber}
            podsArray={podsArray}
            title="CPU"
            unit="Core"
            maxValue={limitCPU / 1000}
            className="h-1/2 p-4"
            longestTick={longestTick}
            onLongestTickChange={(val) => setLongestTick(val)}
          />
          <AreaCard
            data={monitorData?.data?.memory}
            strokeColor="#9A8EE0"
            fillColor="#F2F1FB"
            title={t("Spec.RAM")}
            unit="MB"
            podsArray={podsArray}
            maxValue={limitMemory}
            dataNumber={dataNumber}
            className="h-1/2 p-4"
            longestTick={longestTick}
            onLongestTickChange={(val) => setLongestTick(val)}
          />
        </div>
      ) : (
        <Center className="h-[400px] w-full">
          <span className="flex flex-col items-center">
            <ErrorIcon boxSize={16} />
            <span className="flex pt-2 text-xl">
              <p className="">{t("Error")}</p>
              <u
                className="cursor-pointer text-primary-600"
                onClick={async () => {
                  await queryClient.invalidateQueries({
                    queryKey: ["useGetMonitorDataQuery"],
                    refetchType: "all",
                  });
                }}
              >
                {t("Retry")}
              </u>
            </span>
          </span>
        </Center>
      )}
    </div>
  );
}
