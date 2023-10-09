import { Grid } from '@chakra-ui/react';
import React from 'react';

import config from 'configs/app';
import useApiQuery from 'lib/api/useApiQuery';
import { STATS_COUNTER } from 'stubs/stats';

import DataFetchAlert from '../shared/DataFetchAlert';
import NumberWidget from './NumberWidget';

const NumberWidgetsList = () => {
  const { data, isPlaceholderData, isError } = useApiQuery('stats_counters', {
    queryOptions: {
      placeholderData: { counters: Array(10).fill(STATS_COUNTER) },
    },
  });

  if (isError) {
    return <DataFetchAlert/>;
  }

  return (
    <Grid
      gridTemplateColumns={{ base: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
      gridGap={ 4 }
    >
      {
        data?.counters?.map(({ id, title, value, units, description }, index) => {

          return (
            <NumberWidget
              key={ id + (isPlaceholderData ? index : '') }
              label={ title.replace(/ETH/g, config.chain.currency.symbol || 'ETH') }
              value={ `${ Number(value).toLocaleString(undefined, { maximumFractionDigits: 3, notation: 'compact' }) } ${ units ? units : '' }` }
              isLoading={ isPlaceholderData }
              description={ description?.replace(/ETH/g, config.chain.currency.symbol || 'ETH') }
            />
          );
        })
      }
    </Grid>
  );
};

export default NumberWidgetsList;
