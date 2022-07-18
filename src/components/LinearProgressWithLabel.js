import { Box, LinearProgress, Typography } from "@mui/material";
import PropTypes from 'prop-types';

function LinearProgressWithLabel({value,endIcon,...props}) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: '100%', mr: 1 }}>
          <LinearProgress variant="determinate" value={value} {...props} />
        </Box>
        <Box sx={{ minWidth: 35 }}>
          <Typography variant="body2" color="primary">{`${Math.round(
            value,
          )}%`}</Typography>
        </Box>
        {
          endIcon &&
          <Box sx={{ minWidth: 35 }}>
          {endIcon}
        </Box>
        }
      </Box>
    );
  }

  LinearProgressWithLabel.propTypes = {
    /**
     * The value of the progress indicator for the determinate and buffer variants.
     * Value between 0 and 100.
     */
    value: PropTypes.number.isRequired,
  };
  
export default LinearProgressWithLabel