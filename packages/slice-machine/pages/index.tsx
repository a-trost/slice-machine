import Link from "next/link";
import React, { ChangeEvent, Fragment, useState } from "react";
import {
  Flex,
  Box,
  Button,
  Link as ThemeLink,
  Spinner,
  Text,
  Checkbox,
} from "theme-ui";

import Container from "components/Container";
import CreateCustomTypeModal from "components/Forms/CreateCustomTypeModal";
import Header from "components/Header";
import EmptyState from "components/EmptyState";
import useSliceMachineActions from "@src/modules/useSliceMachineActions";
import { selectLocalCustomTypes } from "@src/modules/customTypes";
import { useSelector } from "react-redux";
import { SliceMachineStoreType } from "@src/redux/type";
import { isLoading } from "@src/modules/loading";
import { LoadingKeysEnum } from "@src/modules/loading/types";
import { MdSpaceDashboard } from "react-icons/md";
import { CustomType, ObjectTabs } from "@models/common/CustomType";

const CustomTypeTable: React.FC<{
  customTypes: ReadonlyArray<CustomType<ObjectTabs>>;
}> = ({ customTypes }) => {
  const firstColumnWidth = "30%";
  const secondColumnWidth = "40%";
  const thirdColumnWidth = "15%";
  const fourthColumnWidth = "10%";

  const onSelectCustomType = (event: ChangeEvent<HTMLInputElement>) => {
    console.log(event.target.checked);
    debugger;
  };

  return (
    <Box
      as={"table"}
      sx={{
        mt: "36px",
      }}
    >
      <thead>
        <tr>
          <Box as={"th"} sx={{ width: "5%" }}></Box>
          <Box as={"th"} sx={{ width: firstColumnWidth }}>
            Name
          </Box>
          <Box as={"th"} sx={{ width: secondColumnWidth }}>
            API ID
          </Box>
          <Box as={"th"} sx={{ width: thirdColumnWidth }}>
            Type
          </Box>
          <Box as={"th"} sx={{ width: fourthColumnWidth }}></Box>
        </tr>
      </thead>
      <tbody>
        {customTypes.map((customType) => (
          <tr key={customType.id}>
            <Box as={"td"} style={{ width: "5%" }}>
              <input type={"checkbox"} onChange={onSelectCustomType} />
            </Box>
            <Box as={"td"} style={{ width: firstColumnWidth }}>
              <Text sx={{ fontWeight: 500 }}>{customType.label}</Text>
            </Box>
            <Box as={"td"} style={{ width: secondColumnWidth }}>
              {customType.id}
            </Box>
            <Box as={"td"} style={{ width: thirdColumnWidth }}>
              {customType.repeatable ? "Repeatable Type" : "Single Type"}
            </Box>
            <Box as={"td"} style={{ width: fourthColumnWidth }}>
              <Button>Delete</Button>
            </Box>
          </tr>
        ))}
      </tbody>
    </Box>
  );
};

const CustomTypes: React.FunctionComponent = () => {
  const { openCreateCustomTypeModal } = useSliceMachineActions();
  const { customTypes, isCreatingCustomType } = useSelector(
    (store: SliceMachineStoreType) => ({
      customTypes: selectLocalCustomTypes(store),
      isCreatingCustomType: isLoading(
        store,
        LoadingKeysEnum.CREATE_CUSTOM_TYPE
      ),
    })
  );

  return (
    <Container sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <Header
        ActionButton={
          customTypes.length ? (
            <div>
              <Button
                sx={{
                  minWidth: "171px",
                }}
              >
                Delete Custom Types
              </Button>
              <Button
                data-cy="create-ct"
                onClick={openCreateCustomTypeModal}
                sx={{
                  minWidth: "171px",
                  ml: 2,
                }}
              >
                {isCreatingCustomType ? (
                  <Spinner color="#FFF" size={14} />
                ) : (
                  "Create a Custom Type"
                )}
              </Button>
            </div>
          ) : undefined
        }
        MainBreadcrumb={
          <Fragment>
            <MdSpaceDashboard /> <Text ml={2}>Custom Types</Text>
          </Fragment>
        }
        breadrumbHref="/"
      />
      {customTypes.length === 0 ? (
        <Flex
          sx={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <EmptyState
            title={"Custom Types"}
            onCreateNew={openCreateCustomTypeModal}
            buttonText={"Create one"}
            documentationComponent={
              <>
                Custom Types are models for your documents. They are the place
                where you define and configure Fields and Slices for your
                content. They will be stored locally, and you will be able to
                push them to your repository.{" "}
                <ThemeLink
                  target={"_blank"}
                  href={"https://prismic.io/docs/core-concepts/custom-types "}
                  sx={(theme) => ({ color: theme?.colors?.primary })}
                >
                  Learn more
                </ThemeLink>
                .
              </>
            }
          />
        </Flex>
      ) : (
        <CustomTypeTable customTypes={customTypes} />
      )}
      <CreateCustomTypeModal />
    </Container>
  );
};

export default CustomTypes;
