import React from "react";
import { Box, Typography, Chip, IconButton, Tooltip } from "@mui/material";
import {
  Edit as EditIcon,
  PriorityHigh as PriorityIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";

const LetterHeader = ({ letter, getPriorityColor, getStatusColor }) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 3,
      }}
    >
      <Box>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          style={{
            direction: "ltr",
            textAlign: "left",
            unicodeBidi: "embed",
          }}
        >
          {letter.subject || "بدون موضوع"}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip
            label={letter.priority || "عادي"}
            color={getPriorityColor(letter.priority)}
            size="medium"
            icon={<PriorityIcon />}
          />
          <Chip
            label={letter.current_status?.procedure_name || "بدون حالة"}
            color={getStatusColor(letter.current_status)}
            size="medium"
            icon={<AssignmentIcon />}
          />
          <Chip
            label={
              (letter.direction == "Incoming" ? "وارد " : "صادر ") +
                " " +
                letter.contact_name || "غير محدد"
            }
            color="default"
            size="medium"
          />
        </Box>
      </Box>
    </Box>
  );
};

export default LetterHeader;
