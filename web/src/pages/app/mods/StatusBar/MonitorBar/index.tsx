import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Center, Spinner, Tooltip, useColorMode } from "@chakra-ui/react";
import { useQueries } from "@tanstack/react-query";
import clsx from "clsx";

import { MonitorIcon } from "@/components/CommonIcon";
import { uniformCapacity } from "@/utils/format";

import { TInstantMonitorData } from "@/apis/typing";
import { DedicatedDatabaseMonitorControllerGetResource } from "@/apis/v1/apps";
import { MonitorControllerGetData } from "@/apis/v1/monitor";
import SysSetting from "@/pages/app/setting/SysSetting";
import useGlobalStore from "@/pages/globalStore";

export const MonitorDataType = ["cpu", "memory"];

export default function MonitorBar() {
  const { currentApp } = useGlobalStore();
  const { t } = useTranslation();
  const { dedicatedDatabase } = currentApp.bundle.resource;
  let databaseCapacity = dedicatedDatabase.capacity;

  const [resources, setResources] = useState<any>([]);
  const [instantData, setInstantData] = useState<TInstantMonitorData>();

  const darkMode = useColorMode().colorMode === "dark";
  const appid = currentApp.bundle.appid;
  const results = useQueries({
    queries: [
      {
        queryKey: ["useGetInstantMonitorDataQuery"],
        queryFn: () =>
          MonitorControllerGetData({
            q: MonitorDataType,
            step: 60,
            type: "instant",
          }),
        refetchInterval: 60000,
      },
      {
        queryKey: ["dedicatedDatabaseMonitorControllerGetResource"],
        queryFn: () => DedicatedDatabaseMonitorControllerGetResource({}),
        refetchInterval: 60000,
      },
    ],
  });

  const allDataLoaded = results.every((result) => result.isSuccess);
  const instantMonitorData = results[0].data?.data;
  const resourceData = results[1].data?.data;
  useEffect(() => {
    if (allDataLoaded) {
      const { cpu, memory } = instantMonitorData || {};
      const database = resourceData.dataSize;
      const data = {
        cpu,
        memory,
        database,
      };
      setInstantData(data);
    }
  }, [appid, instantMonitorData, resourceData, allDataLoaded]);

  const getAverage = (data: any = []) => {
    let total = 0;
    data.forEach((item: any) => {
      if (!item.value?.length) return 0;
      total += Number(item.value[1]);
    });
    return total / data.length || 0;
  };

  useEffect(() => {
    if (!instantData) return;
    setResources([
      {
        label: `CPU`,
        percent: getAverage(instantData.cpu),
        color: "#47C8BF",
      },
      {
        label: t("Spec.RAM"),
        percent: getAverage(instantData.memory),
        color: "#8172D8",
      },
      {
        label: t("Spec.Database"),
        percent: (uniformCapacity(getAverage(instantData.database)) / databaseCapacity) * 100,
        color: "#ED598E",
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instantData]);

  const limitPercentage = (value: number) => {
    if (value > 100) {
      return 100;
    } else if (value < 3) {
      return 3;
    }
    return value;
  };

  return (
    <SysSetting currentTab="monitorRuntime">
      <div className="flex items-center">
        <span
          className={clsx(
            "mr-4 flex h-full cursor-pointer items-center",
            darkMode ? "" : "text-grayModern-700",
          )}
        >
          <MonitorIcon className="mr-1" />
          {t("SettingPanel.MonitorSetting") + " :"}
        </span>
        <Center className="w-40 space-x-2">
          {resources.length !== 0 ? (
            resources.map((resource: any, index: number) => (
              <Tooltip key={index} label={`${resource.label}: ${resource.percent.toFixed(2)}%`}>
                <div className="h-1 w-12 cursor-pointer rounded-full bg-grayModern-100">
                  <div
                    style={{
                      width: `${limitPercentage(resource.percent).toFixed(2)}%`,
                      backgroundColor: resource.color,
                    }}
                    className={`h-full rounded-full`}
                  ></div>
                </div>
              </Tooltip>
            ))
          ) : (
            <Spinner size="xs" color={"grayModern.500"} />
          )}
        </Center>
      </div>
    </SysSetting>
  );
}
