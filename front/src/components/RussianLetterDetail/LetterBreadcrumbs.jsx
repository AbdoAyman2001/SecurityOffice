import React from "react";
import { useNavigate } from "react-router-dom";
import { Breadcrumbs, Link, Typography } from "@mui/material";

const LetterBreadcrumbs = ({ letter }) => {
  const navigate = useNavigate();

  return (
    <Breadcrumbs sx={{ mb: 2 }}>
      <Link
        color="inherit"
        href="#"
        onClick={() => navigate("/russian-letters")}
        sx={{ textDecoration: "none" }}
      >
        الخطابات الروسية
      </Link>
      <Typography color="text.primary">
        تفاصيل الخطاب #{letter.correspondence_id}
      </Typography>
    </Breadcrumbs>
  );
};

export default LetterBreadcrumbs;
